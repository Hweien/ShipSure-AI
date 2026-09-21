/**
 * ShipSure AI - Real SDOC Dataset Loader
 *
 * Loads the complete SDOC hackathon dataset directly from the
 * sdoc-hackathon-docker server.
 *
 * Pipeline:
 *
 * Docker /emails
 *      ↓
 * Real inbox
 *      ↓
 * Docker /attachments/{path}
 *      ↓
 * Real SI / BL documents
 *      ↓
 * DS1 field extraction
 *      ↓
 * DS2 deterministic verification
 *      ↓
 * Evaluation submission JSON
 */

import {
  EmailRecord,
  ExtractedDocumentFields,
  SubmissionJson,
} from "../../types";

import { extractDocumentFields } from "../documentIntelligence/fieldExtractor";
import { verifyDocuments } from "../verificationEngine";
const DEFAULT_DOCKER_URL = "http://localhost:8080";

/**
 * Result returned after processing one real email.
 */
export interface SDOCProcessedCase {
  email: EmailRecord;

  siAttachment: string | null;
  blAttachment: string | null;

  siFields: ExtractedDocumentFields | null;
  blFields: ExtractedDocumentFields | null;

  verification: ReturnType<typeof verifyDocuments>;

  processingError: string | null;
}

/**
 * Result returned after processing the entire real dataset.
 */
export interface SDOCDatasetResult {
  emails: EmailRecord[];
  cases: SDOCProcessedCase[];
  submission: SubmissionJson;

  processedCount: number;
  failedCount: number;
}

/**
 * Simple helper for Docker API requests.
 */
async function dockerFetch(
  dockerUrl: string,
  path: string
): Promise<Response> {
  const response = await fetch(
    `${dockerUrl.replace(/\/$/, "")}${path}`
  );

  if (!response.ok) {
    throw new Error(
      `Docker request failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  return response;
}

/**
 * Load the complete inbox from Docker.
 */
export async function loadSDOCInbox(
  dockerUrl: string = DEFAULT_DOCKER_URL
): Promise<EmailRecord[]> {
  const response = await dockerFetch(
    dockerUrl,
    "/emails"
  );

  const emails = await response.json();

  if (!Array.isArray(emails)) {
    throw new Error("Docker /emails did not return an array.");
  }

  return emails as EmailRecord[];
}

/**
 * Load one email by email_id.
 */
export async function loadSDOCEmail(
  emailId: string,
  dockerUrl: string = DEFAULT_DOCKER_URL
): Promise<EmailRecord> {
  const encodedId = encodeURIComponent(emailId);

  const response = await dockerFetch(
    dockerUrl,
    `/emails/${encodedId}`
  );

  return (await response.json()) as EmailRecord;
}

/**
 * Download a real attachment from Docker.
 *
 * This returns the raw Blob because the attachment may be:
 * - PDF
 * - image
 * - text
 * - another supported document format
 *
 * We do not assume that every attachment is plain text.
 */
export async function loadSDOCAttachment(
  attachmentPath: string,
  dockerUrl: string = DEFAULT_DOCKER_URL
): Promise<Blob> {
  const encodedPath = attachmentPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await dockerFetch(
    dockerUrl,
    `/attachments/${encodedPath}`
  );

  return await response.blob();
}

/**
 * Determine whether an attachment looks like an SI.
 */
function isSIAttachment(path: string): boolean {
  const name = path.toLowerCase();

  return (
    name.includes("si") ||
    name.includes("shipping_instruction") ||
    name.includes("shipping-instruction")
  );
}

/**
 * Determine whether an attachment looks like a BL.
 */
function isBLAttachment(path: string): boolean {
  const name = path.toLowerCase();

  return (
    name.includes("bl") ||
    name.includes("bill_of_lading") ||
    name.includes("bill-of-lading") ||
    name.includes("bill of lading")
  );
}

/**
 * Find the SI attachment in an email.
 */
export function findSIAttachment(
  email: EmailRecord
): string | null {
  const attachments = email.attachments ?? [];

  return (
    attachments.find((path) => isSIAttachment(path)) ??
    null
  );
}

/**
 * Find the BL attachment in an email.
 */
export function findBLAttachment(
  email: EmailRecord
): string | null {
  const attachments = email.attachments ?? [];

  return (
    attachments.find((path) => isBLAttachment(path)) ??
    null
  );
}

/**
 * Convert a Blob to text.
 *
 * IMPORTANT:
 * This works for text-based attachments.
 *
 * If the real SDOC dataset contains PDFs/images that require OCR,
 * this function should be replaced by the project's existing
 * Vision/OCR endpoint before DS1 extraction.
 */
async function blobToText(blob: Blob): Promise<string> {
  return await blob.text();
}

/**
 * Extract fields from one real attachment.
 *
 * DS1 currently accepts text, so we download the real attachment
 * and convert it to text before calling DS1.
 */
async function extractRealAttachment(
  attachmentPath: string,
  documentType: "SI" | "BL",
  dockerUrl: string
): Promise<ExtractedDocumentFields> {
  const blob = await loadSDOCAttachment(
    attachmentPath,
    dockerUrl
  );

  const text = await blobToText(blob);

  if (!text.trim()) {
    throw new Error(
      `Attachment is empty or could not be converted to text: ${attachmentPath}`
    );
  }

  return await extractDocumentFields(
    text,
    documentType
  );
}

/**
 * Process one real email.
 *
 * Steps:
 *
 * 1. Find SI
 * 2. Find BL
 * 3. Download SI
 * 4. Download BL
 * 5. DS1 extracts SI
 * 6. DS1 extracts BL
 * 7. DS2 compares SI vs BL
 */
export async function processSDOCEmail(
  email: EmailRecord,
  dockerUrl: string = DEFAULT_DOCKER_URL
): Promise<SDOCProcessedCase> {
  const siAttachment = findSIAttachment(email);
  const blAttachment = findBLAttachment(email);

  let siFields: ExtractedDocumentFields | null = null;
  let blFields: ExtractedDocumentFields | null = null;

  let processingError: string | null = null;

  /**
   * Extract SI.
   */
  if (siAttachment) {
    try {
      siFields = await extractRealAttachment(
        siAttachment,
        "SI",
        dockerUrl
      );
    } catch (error) {
      processingError =
        error instanceof Error
          ? error.message
          : String(error);
    }
  }

  /**
   * Extract BL.
   */
  if (blAttachment) {
    try {
      blFields = await extractRealAttachment(
        blAttachment,
        "BL",
        dockerUrl
      );
    } catch (error) {
      processingError =
        processingError
          ? `${processingError}; ${
              error instanceof Error
                ? error.message
                : String(error)
            }`
          : error instanceof Error
          ? error.message
          : String(error);
    }
  }

  /**
   * DS2 verification.
   *
   * We deliberately pass attachment presence so that
   * missing SI/BL documents become NEEDS_REVIEW.
   */
  const verification = verifyDocuments(
    siFields,
    blFields,
    {
      hasSi: Boolean(siAttachment),
      hasBl: Boolean(blAttachment),
    }
  );

  return {
    email,

    siAttachment,
    blAttachment,

    siFields,
    blFields,

    verification,

    processingError,
  };
}

/**
 * Convert a processed result into the exact submission format
 * expected by the Docker scoring server.
 */
function processedCaseToSubmission(
  result: SDOCProcessedCase
): SubmissionJson[string] {
  const verification = result.verification;

  /**
   * Category must come from your email classification system.
   *
   * Until the email classifier is connected here, document
   * comparison emails are treated as BL_COMPARISON when both
   * SI and BL are present.
   *
   * This is a temporary integration point for Stage 1.
   */
  const category =
    result.siAttachment && result.blAttachment
      ? "BL_COMPARISON"
      : "GENERAL";

  return {
    category,

    status: verification.status,

    review_reason:
      verification.reviewReason,

    defect_fields:
      verification.defectFields,

    has_defect:
      verification.hasDefect,
  };
}

/**
 * Generate the complete submission object.
 *
 * IMPORTANT:
 * Every real email is included.
 */
export function generateSDOCSubmission(
  cases: SDOCProcessedCase[]
): SubmissionJson {
  const submission: SubmissionJson = {};

  for (const result of cases) {
    submission[result.email.email_id] =
      processedCaseToSubmission(result);
  }

  return submission;
}

/**
 * Process the ENTIRE real SDOC dataset.
 *
 * This is the main function EvaluationView should call.
 */
export async function processEntireSDOCDataset(
  dockerUrl: string = DEFAULT_DOCKER_URL,
  onProgress?: (
    completed: number,
    total: number
  ) => void
): Promise<SDOCDatasetResult> {
  /**
   * 1. Load every real email.
   */
  const emails = await loadSDOCInbox(
    dockerUrl
  );

  console.log(
    `SDOC: loaded ${emails.length} real emails`
  );

  const cases: SDOCProcessedCase[] = [];

  let failedCount = 0;

  /**
   * 2. Process every email.
   *
   * Sequential processing is intentionally used here first.
   * It prevents sending hundreds of simultaneous requests
   * to the DS1 backend.
   */
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    try {
      console.log(
        `SDOC: processing ${i + 1}/${emails.length}: ${email.email_id}`
      );

      const result =
        await processSDOCEmail(
          email,
          dockerUrl
        );

      cases.push(result);

      if (result.processingError) {
        failedCount++;
      }
    } catch (error) {
      failedCount++;

      console.error(
        `Failed to process ${email.email_id}:`,
        error
      );

      /**
       * Even if processing fails, we still need an entry
       * for this email in the submission.
       */
      const fallbackVerification =
        verifyDocuments(
          null,
          null,
          {
            hasSi: Boolean(
              findSIAttachment(email)
            ),
            hasBl: Boolean(
              findBLAttachment(email)
            ),
          }
        );

      cases.push({
        email,

        siAttachment:
          findSIAttachment(email),

        blAttachment:
          findBLAttachment(email),

        siFields: null,
        blFields: null,

        verification:
          fallbackVerification,

        processingError:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    onProgress?.(
      i + 1,
      emails.length
    );
  }

  /**
   * 3. Generate submission using ALL real emails.
   */
  const submission =
    generateSDOCSubmission(cases);

  return {
    emails,

    cases,

    submission,

    processedCount:
      emails.length - failedCount,

    failedCount,
  };
}