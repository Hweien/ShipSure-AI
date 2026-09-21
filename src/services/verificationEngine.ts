/**
 * ShipSure AI - Deterministic Verification & Validation Engine
 * Implements strict compliance with SDOC Hackathon evaluation logic
 */

import {
  ComparisonField,
  COMPARISON_FIELDS,
  ExtractedDocumentFields,
  FieldMatchStatus,
  ReviewReason,
  SingleFieldComparison,
  VerificationStatus
} from "../types";
import {
  normalizeContainerCount,
  normalizeEntityName,
  normalizeGrossWeight,
  normalizePort
} from "./normalization";

export interface VerificationResult {
  status: VerificationStatus;
  hasDefect: boolean;
  defectFields: ComparisonField[];
  reviewReason: ReviewReason | null;
  fieldComparisons: SingleFieldComparison[];
  confidenceScore: number;
  explanation: string;
}

const FIELD_LABELS: Record<ComparisonField, string> = {
  shipper: "Shipper",
  consignee: "Consignee",
  notify_party: "Notify Party",
  port_of_loading: "Port of Loading",
  port_of_discharge: "Port of Discharge",
  container_count: "Container Count",
  gross_weight_kg: "Gross Weight (KG)"
};

export function normalizeFieldValue(
  field: ComparisonField,
  raw: string | number
): string | number {
  switch (field) {
    case "shipper":
    case "consignee":
    case "notify_party":
      return normalizeEntityName(
        String(raw)
      ).normalized;

    case "port_of_loading":
    case "port_of_discharge":
      return normalizePort(
        String(raw)
      ).normalized;

    case "container_count":
      return normalizeContainerCount(
        raw
      ).normalized;

    case "gross_weight_kg":
      return normalizeGrossWeight(
        raw
      ).normalized;
  }
}

export function normalizeDocumentFields(
  document: ExtractedDocumentFields
): ExtractedDocumentFields {
  for (
    const field of
    COMPARISON_FIELDS
  ) {
    const item =
      document.fields[field];

    if (
      item?.raw !== null &&
      item?.raw !== undefined
    ) {
      item.normalized =
        normalizeFieldValue(
          field,
          item.raw
        );
    }
  }

  return document;
}

function isMissingValue(
  raw: unknown
): boolean {
  if (
    raw === null ||
    raw === undefined
  ) {
    return true;
  }

  const value =
    String(raw)
      .trim()
      .toUpperCase();

  if (!value) {
    return true;
  }

  return (
    value === "TBA" ||
    value === "N/A" ||
    value === "NA" ||
    /^\?+$/.test(value) ||
    /^_+$/.test(value)
  );
}

/**
 * Compares two extracted documents (SI as reference, BL as candidate)
 */
export function verifyDocuments(
  si: ExtractedDocumentFields | null | undefined,
  bl: ExtractedDocumentFields | null | undefined,
  attachmentPresence: { hasSi: boolean; hasBl: boolean } = { hasSi: true, hasBl: true }
): VerificationResult {
  // Check Attachment Presence first
  if (!attachmentPresence.hasSi || !attachmentPresence.hasBl) {
    return {
      status: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "missing_attachment",
      fieldComparisons: [],
      confidenceScore: 100,
      explanation: "Required document attachment is missing from the request email."
    };
  }

  if (!si || !bl) {
    return {
      status: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "unreadable",
      fieldComparisons: [],
      confidenceScore: 80,
      explanation: "Unable to parse or read attachment content."
    };
  }

  // Check for wrong document type indicator
  if (si.documentType !== "SI" || bl.documentType !== "BL") {
    return {
      status: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "wrong_doc_type",
      fieldComparisons: [],
      confidenceScore: 90,
      explanation: "Attachment format does not correspond to expected Shipping Instruction or Bill of Lading."
    };
  }

  normalizeDocumentFields(si);
  normalizeDocumentFields(bl);

  const fieldComparisons: SingleFieldComparison[] = [];
  const defectFields: ComparisonField[] = [];
  let missingValueDetected = false;
  let unreadableDetected = false;

  for (const field of COMPARISON_FIELDS) {
    const siField = si.fields[field];
    const blField = bl.fields[field];

    const label = FIELD_LABELS[field];

    // Check if field was unreadable in either document
    if (
      si.unreadableFields?.includes(field) ||
      bl.unreadableFields?.includes(field)
    ) {
      unreadableDetected = true;
      fieldComparisons.push({
        field,
        label,
        siEvidence: siField
          ? {
              documentType: "SI",
              originalValue: String(siField.raw || ""),
              normalizedValue: siField.normalized ?? "",
              snippet: siField.snippet,
              confidence: "LOW"
            }
          : null,
        blEvidence: blField
          ? {
              documentType: "BL",
              originalValue: String(blField.raw || ""),
              normalizedValue: blField.normalized ?? "",
              snippet: blField.snippet,
              confidence: "LOW"
            }
          : null,
        status: "NEEDS_REVIEW",
        notes: `Unreadable or smudged text in source document for ${label}`
      });
      continue;
    }

    // Check if either is completely missing
    if (
      !siField ||
      !blField ||
      isMissingValue(siField.raw) ||
      isMissingValue(blField.raw)
    ) {
      missingValueDetected = true;

      fieldComparisons.push({
        field,
        label,

        siEvidence:
          siField &&
          !isMissingValue(
            siField.raw
          )
            ? {
                documentType: "SI",
                originalValue:
                  String(
                    siField.raw
                  ),

                normalizedValue:
                  normalizeFieldValue(
                    field,
                    siField.raw!
                  ),

                snippet:
                  siField.snippet,

                confidence:
                  "MEDIUM",
              }
            : null,

        blEvidence:
          blField &&
          !isMissingValue(
            blField.raw
          )
            ? {
                documentType: "BL",

                originalValue:
                  String(
                    blField.raw
                  ),

                normalizedValue:
                  normalizeFieldValue(
                    field,
                    blField.raw!
                  ),

                snippet:
                  blField.snippet,

                confidence:
                  "MEDIUM",
              }
            : null,

        status:
          "NEEDS_REVIEW",

        notes:
          `Required value missing for ${label}`,
      });

      continue;
    }

    const normalizedSi =
      normalizeFieldValue(
        field,
        siField.raw!
      );

    const normalizedBl =
      normalizeFieldValue(
        field,
        blField.raw!
      );

    // Perform Field-Specific Comparison
    let matchStatus: FieldMatchStatus = "MISMATCH";
    let notes = "";

    if (field === "container_count" || field === "gross_weight_kg") {
      const numSi =
        Number(
          normalizedSi
        );

      const numBl =
        Number(
          normalizedBl
        );

      if (numSi === numBl) {
        matchStatus = String(siField.raw).trim() === String(blField.raw).trim() ? "EXACT_MATCH" : "NORMALIZED_MATCH";
        notes = matchStatus === "EXACT_MATCH" ? "Exact numeric equality" : "Normalized unit equality (e.g. MT to KG)";
      } else {
        matchStatus = "MISMATCH";
        const diff = numBl - numSi;
        notes = `Numeric difference: ${diff > 0 ? "+" : ""}${diff} (${numSi} vs ${numBl})`;
        defectFields.push(field);
      }
    } else {
      // String / Entity / Port comparison
      const rawSi = String(siField.raw || "").trim();
      const rawBl = String(blField.raw || "").trim();
      const normSi =
        String(
          normalizedSi
        ).trim();

      const normBl =
        String(
          normalizedBl
        ).trim();

      if (rawSi.toUpperCase() === rawBl.toUpperCase()) {
        matchStatus = "EXACT_MATCH";
        notes = "Exact text match";
      } else if (normSi === normBl) {
        matchStatus = "NORMALIZED_MATCH";
        notes = "Equivalent semantic / alias match";
      } else {
        matchStatus = "MISMATCH";
        notes = `Value mismatch: "${normSi}" vs "${normBl}"`;
        defectFields.push(field);
      }
    }

    fieldComparisons.push({
      field,
      label,
      siEvidence: {
        documentType: "SI",
        originalValue: String(siField.raw),
        normalizedValue: normalizedSi,
        snippet: siField.snippet,
        confidence: "HIGH"
      },
      blEvidence: {
        documentType: "BL",
        originalValue: String(blField.raw),
        normalizedValue: normalizedBl ?? "",
        snippet: blField.snippet,
        confidence: "HIGH"
      },
      status: matchStatus,
      notes
    });
  }

  // Determine Overall Status according to SDOC Hackathon specification:
  // Status: OK (all 7 match), MISMATCH (>=1 differs), NEEDS_REVIEW (unreadable/missing)
  if (unreadableDetected) {
    return {
      status: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "unreadable",
      fieldComparisons,
      confidenceScore: 75,
      explanation: "One or more required fields contain unreadable or corrupted characters."
    };
  }

  if (missingValueDetected) {
    return {
      status: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "missing_value",
      fieldComparisons,
      confidenceScore: 85,
      explanation: "One or more mandatory shipment fields could not be found in the document."
    };
  }

  if (defectFields.length > 0) {
    return {
      status: "MISMATCH",
      hasDefect: true,
      defectFields,
      reviewReason: null,
      fieldComparisons,
      confidenceScore: 98,
      explanation: `${defectFields.length} discrepancy${defectFields.length > 1 ? "ies" : ""} detected: ${defectFields.map(f => FIELD_LABELS[f]).join(", ")}.`
    };
  }

  return {
    status: "OK",
    hasDefect: false,
    defectFields: [],
    reviewReason: null,
    fieldComparisons,
    confidenceScore: 99,
    explanation: "No mismatch detected. All 7 shipment fields agree between SI and Draft BL."
  };
}
