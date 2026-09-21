import {
  ExtractedDocumentFields,
  ComparisonField,
  FieldEvidence,
  SingleFieldComparison,
  COMPARISON_FIELDS,
} from "../../types";

import {
  normalizeField,
} from "./normalization";

import {
  isSemanticMatch,
} from "./semanticMatching";


// Get a readable field name
function getFieldLabel(
  field: ComparisonField
): string {

  const labels: Record<ComparisonField, string> = {
    shipper: "Shipper",
    consignee: "Consignee",
    notify_party: "Notify Party",
    port_of_loading: "Port of Loading",
    port_of_discharge: "Port of Discharge",
    container_count: "Container Count",
    gross_weight_kg: "Gross Weight (kg)",
  };

  return labels[field];
}


// Convert DS1 confidence into HIGH, MEDIUM, or LOW
function getConfidence(
  confidence?: number
): "HIGH" | "MEDIUM" | "LOW" {

  if (confidence === undefined) {
    return "LOW";
  }

  if (confidence >= 0.8) {
    return "HIGH";
  }

  if (confidence >= 0.5) {
    return "MEDIUM";
  }

  return "LOW";
}


// Create evidence for one field
function createEvidence(
  documentType: "SI" | "BL",
  field: ComparisonField,
  rawValue: string,
  confidence?: number,
  snippet?: string
): FieldEvidence {

  const normalizedValue = normalizeField(
    field,
    rawValue
  );

  return {
    documentType,
    originalValue: rawValue,
    normalizedValue: normalizedValue ?? "",
    confidence: getConfidence(confidence),
    snippet,
  };
}


// Compare one field between SI and BL
async function compareField(
  field: ComparisonField,
  siData: ExtractedDocumentFields,
  blData: ExtractedDocumentFields
): Promise<SingleFieldComparison> {

  const siField = siData.fields[field];
  const blField = blData.fields[field];

  const siValue = siField.raw;
  const blValue = blField.raw;


  // Check if either value is missing
  if (!siValue || !blValue) {

    return {
      field,
      label: getFieldLabel(field),

      siEvidence: siValue
        ? createEvidence(
            "SI",
            field,
            siValue,
            siField.confidence,
            siField.snippet
          )
        : null,

      blEvidence: blValue
        ? createEvidence(
            "BL",
            field,
            blValue,
            blField.confidence,
            blField.snippet
          )
        : null,

      status: "NEEDS_REVIEW",
      notes: "One or both values are missing.",
    };
  }


  // Normalize both values
  const siNormalized = normalizeField(
    field,
    siValue
  );

  const blNormalized = normalizeField(
    field,
    blValue
  );


  let status:
    | "EXACT_MATCH"
    | "NORMALIZED_MATCH"
    | "MISMATCH";


  // Original values are exactly the same
  if (siValue === blValue) {

    status = "EXACT_MATCH";
  }


  // Values are different but become the same
  // after normalization
  else if (siNormalized === blNormalized) {

    status = "NORMALIZED_MATCH";
  }


  // Values are still different
  // Try Gemini semantic matching
  else {

    const semanticMatch = await isSemanticMatch(
      field,
      siValue,
      blValue
    );


    if (semanticMatch) {

      status = "NORMALIZED_MATCH";

    } else {

      status = "MISMATCH";
    }
  }


  return {
    field,
    label: getFieldLabel(field),

    siEvidence: createEvidence(
      "SI",
      field,
      siValue,
      siField.confidence,
      siField.snippet
    ),

    blEvidence: createEvidence(
      "BL",
      field,
      blValue,
      blField.confidence,
      blField.snippet
    ),

    status,
  };
}


// Compare all 7 fields
export async function compareDocuments(
  siData: ExtractedDocumentFields,
  blData: ExtractedDocumentFields
): Promise<SingleFieldComparison[]> {

  return Promise.all(
    COMPARISON_FIELDS.map((field) =>
      compareField(
        field,
        siData,
        blData
      )
    )
  );
}