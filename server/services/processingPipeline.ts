import type {
  DocumentIdentificationResult,
  EmailClassificationResult,
  EmailRecord,
  ExtractedDocumentFields,
  ReadDocumentResult,
  ShipmentCase,
} from "../../src/types";

import { verifyDocuments } from "../../src/services/verificationEngine";

type PostJson = <T>(
  path: string,
  body: unknown
) => Promise<T>;

export async function processEmailPipeline(
  email: EmailRecord,
  postJson: PostJson
): Promise<ShipmentCase> {
    const now = new Date().toISOString();
    
    console.log(
    `[Pipeline ${email.email_id}] 1. Classifying email`
    );

  // ---------------------------------------------------------
  // 1. DS1 — classify email
  // ---------------------------------------------------------
  const classification =
    await postJson<EmailClassificationResult>(
      "/api/ds1/classify-email",
      email
    );

  const baseCase: ShipmentCase = {
    id: `CASE-${email.email_id}`,
    emailId: email.email_id,

    // Until a real shipment / booking reference extractor is added,
    // retain the email ID rather than inventing a reference.
    shipmentReference: email.email_id,

    emailSubject: email.subject,

    // Docker emails do not contain a date.
    // This is therefore processing/ingestion time.
    receivedDate: email.date ?? now,

    category: classification.category,

    verificationStatus: "OK",
    hasDefect: false,
    defectFields: [],
    reviewReason: null,

    priorityScore: 0,
    priorityReasons: [],

    fieldComparisons: [],

    blVersion: 1,
    hasRevision: false,

    humanReviewed: false,

    timeline: [
      {
        id: `EV-${email.email_id}-CLASSIFY`,
        timestamp: now,
        agent: "Inbox Agent",
        action: "Email Classification",
        summary:
          `Classified as ${classification.category}`,
        status: "success",
        details: {
          confidence: classification.confidence,
          evidence: classification.evidence,
        },
      },
    ],

    decisions: [],
  };

  // ---------------------------------------------------------
  // 2. Non-BL comparison emails stop here
  // ---------------------------------------------------------
  if (
    classification.category !==
    "BL_COMPARISON"
  ) {
    return baseCase;
  }

  // ---------------------------------------------------------
  // 3. Missing attachments
  // ---------------------------------------------------------
  if (
    !email.attachments ||
    email.attachments.length === 0
  ) {
    return {
      ...baseCase,

      verificationStatus: "NEEDS_REVIEW",
      reviewReason: "missing_attachment",

      priorityScore: 90,
      priorityReasons: [
        "BL comparison request has no attachments",
      ],

      timeline: [
        ...baseCase.timeline,
        {
          id: `EV-${email.email_id}-MISSING`,
          timestamp: new Date().toISOString(),
          agent: "Validation Agent",
          action: "Attachment Validation",
          summary:
            "Required SI / BL attachment is missing",
          status: "warning",
        },
      ],
    };
  }

    console.log(
    `[Pipeline ${email.email_id}] 2. Reading attachments`
    );
  // ---------------------------------------------------------
  // 4. DS1 — read attachments
  // ---------------------------------------------------------
  const attachmentContents =
    await Promise.all(
      email.attachments.map((attachmentPath) =>
        postJson<ReadDocumentResult>(
          "/api/ds1/read-document",
          {
            path: attachmentPath,
          }
        )
      )
        );
    
    const unreadableDocument =
        attachmentContents.find(
            (doc: any) =>
            doc.unreadable === true
        );

        if (unreadableDocument) {
        console.warn(
            `[Pipeline ${email.email_id}] Unreadable document detected: ${unreadableDocument.path}`
        );

        return {
            ...baseCase,

            verificationStatus:
            "NEEDS_REVIEW",

            hasDefect: false,

            defectFields: [],

            reviewReason:
            "unreadable",

            priorityScore: 95,

            priorityReasons: [
            `Unreadable document: ${unreadableDocument.path}`,
            ],

            timeline: [
            ...baseCase.timeline,
            {
                id:
                `EV-${email.email_id}-UNREADABLE`,

                timestamp:
                new Date().toISOString(),

                agent:
                "Document Agent",

                action:
                "Document Reading",

                summary:
                `Document could not be reliably read: ${unreadableDocument.path}`,

                status:
                "warning",

                details: {
                path:
                    unreadableDocument.path,

                readError:
                    unreadableDocument.readError ||
                    "unreadable_document",
                },
            },
            ],
        };
        }

    console.log(
    `[Pipeline ${email.email_id}] 3. Identifying SI/BL`
    );
  // ---------------------------------------------------------
  // 5. DS1 — identify SI and BL
  // ---------------------------------------------------------
  const identifiedDocuments =
    await postJson<DocumentIdentificationResult[]>(
      "/api/ds1/identify-documents",
      {
        email,
        attachmentContents,
      }
    );

  const siIdentification =
    identifiedDocuments.find(
      (document) =>
        document.documentType === "SI"
    );

  const blIdentification =
    identifiedDocuments.find(
      (document) =>
        document.documentType === "BL"
    );

  if (
    !siIdentification ||
    !blIdentification
  ) {
    return {
      ...baseCase,

      verificationStatus: "NEEDS_REVIEW",
      reviewReason: "wrong_doc_type",

      priorityScore: 90,
      priorityReasons: [
        "Unable to identify both SI and BL documents",
      ],

      timeline: [
        ...baseCase.timeline,
        {
          id: `EV-${email.email_id}-IDENTIFY`,
          timestamp: new Date().toISOString(),
          agent: "Document Agent",
          action: "Document Identification",
          summary:
            "Could not reliably identify both SI and BL",
          status: "warning",
        },
      ],
    };
  }

  const siRead =
    attachmentContents.find(
      (item) =>
        item.path === siIdentification.path
    );

  const blRead =
    attachmentContents.find(
      (item) =>
        item.path === blIdentification.path
    );

  if (
    !siRead?.content ||
    !blRead?.content
  ) {
    return {
      ...baseCase,

      verificationStatus: "NEEDS_REVIEW",
      reviewReason: "unreadable",

      priorityScore: 95,
      priorityReasons: [
        "SI or BL content could not be read",
      ],

      timeline: [
        ...baseCase.timeline,
        {
          id: `EV-${email.email_id}-READ`,
          timestamp: new Date().toISOString(),
          agent: "Document Agent",
          action: "Document Reading",
          summary:
            "SI or BL content could not be reliably read",
          status: "warning",
        },
      ],
    };
  }

    console.log(
    `[Pipeline ${email.email_id}] 4. Extracting SI`
    );
  // ---------------------------------------------------------
  // 6. DS1 — extract 7 fields
  // ---------------------------------------------------------
  const siData =
    await postJson<ExtractedDocumentFields>(
      "/api/ds1/extract-fields",
      {
        text: siRead.content,
        documentType: "SI",
      }
    );

    console.log(
    `[Pipeline ${email.email_id}] 5. Extracting BL`
    );
  const blData =
    await postJson<ExtractedDocumentFields>(
      "/api/ds1/extract-fields",
      {
        text: blRead.content,
        documentType: "BL",
      }
    );

    console.log(
    `[Pipeline ${email.email_id}] 6. Running verification`
    );
  // ---------------------------------------------------------
  // 7. DS2 — normalize + deterministic verification
  // ---------------------------------------------------------
  const verification = verifyDocuments(
    siData,
    blData,
    {
      hasSi: true,
      hasBl: true,
    }
    );
    
    console.log(
    `[Pipeline ${email.email_id}] COMPLETE`
    );

  // ---------------------------------------------------------
  // 8. Build final ShipmentCase
  // ---------------------------------------------------------
  return {
    ...baseCase,

    verificationStatus:
      verification.status,

    hasDefect:
      verification.hasDefect,

    defectFields:
      verification.defectFields,

    reviewReason:
      verification.reviewReason,

    fieldComparisons:
      verification.fieldComparisons,

    siData,
    blData,

    priorityScore:
      verification.status === "NEEDS_REVIEW"
        ? 95
        : verification.hasDefect
          ? 80
          : 20,

    priorityReasons: [
      verification.explanation,
    ],

    timeline: [
      ...baseCase.timeline,

      {
        id: `EV-${email.email_id}-DOCUMENT`,
        timestamp: new Date().toISOString(),
        agent: "Document Agent",
        action:
          "Document Extraction",
        summary:
          "SI and BL identified and seven fields extracted",
        status: "success",
      },

      {
        id: `EV-${email.email_id}-VERIFY`,
        timestamp: new Date().toISOString(),
        agent: "Verification Agent",
        action:
          "Seven-Field Verification",
        summary:
          verification.explanation,
        status:
          verification.status === "OK"
            ? "success"
            : verification.status ===
                "MISMATCH"
              ? "error"
              : "warning",
        details: {
          defectFields:
            verification.defectFields,
          reviewReason:
            verification.reviewReason,
        },
      },
    ],
  };
}