import {
  COMPARISON_FIELDS,
  ComparisonField,
  ExtractedDocumentFields,
  RevisionComparison,
} from "../../src/types";

function normalizedValue(
  doc: ExtractedDocumentFields,
  field: ComparisonField,
): string | number | undefined {
  const item = doc.fields[field] as { normalized?: string | number } | undefined;
  return item?.normalized;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (a == null || b == null) return false;
  return String(a).trim().replace(/\s+/g, " ").toUpperCase() ===
    String(b).trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Pure 3-way diff. It assumes DS1/DS2 already extracted and normalized the
 * fields. CS1 owns the workflow/state transition, not the semantic extraction.
 */
export function compareRevision(
  caseId: string,
  si: ExtractedDocumentFields,
  blV1: ExtractedDocumentFields,
  blV2: ExtractedDocumentFields,
): RevisionComparison {
  const correctedFields: RevisionComparison["correctedFields"] = [];
  const unexpectedChanges: RevisionComparison["unexpectedChanges"] = [];
  let hasMissingValue = false;

  for (const field of COMPARISON_FIELDS) {
    const siValue = normalizedValue(si, field);
    const v1Value = normalizedValue(blV1, field);
    const v2Value = normalizedValue(blV2, field);

    if (siValue == null || v1Value == null || v2Value == null) {
      hasMissingValue = true;
      continue;
    }

    const v1MatchedSi = sameValue(siValue, v1Value);
    const v2MatchesSi = sameValue(siValue, v2Value);
    const v1MatchesV2 = sameValue(v1Value, v2Value);

    // A field that was wrong in V1 is a requested correction candidate.
    if (!v1MatchedSi) {
      correctedFields.push({
        field,
        siValue,
        v1Value,
        v2Value,
        status: v2MatchesSi ? "CORRECTED" : "STILL_MISMATCH",
      });
      continue;
    }

    // A field that was correct in V1 but changed in V2 is unsolicited.
    if (v1MatchedSi && !v2MatchesSi && !v1MatchesV2) {
      unexpectedChanges.push({
        field,
        siValue,
        v1Value,
        v2Value,
        status: "UNEXPECTED_CHANGE",
        reason: "BL V2 changed a field that already matched the SI in BL V1.",
      });
    }
  }

  const unresolvedCorrection = correctedFields.some(
    (item) => item.status === "STILL_MISMATCH",
  );

  return {
    caseId,
    originalSi: si,
    blV1,
    blV2,
    correctedFields,
    unexpectedChanges,
    overallOutcome:
      hasMissingValue || unresolvedCorrection || unexpectedChanges.length > 0
        ? "NEEDS_HUMAN_REVIEW"
        : "RESOLVED",
  };
}
