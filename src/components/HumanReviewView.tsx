import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

import {
  COMPARISON_FIELDS,
  ComparisonField,
  ShipmentCase,
} from "../types";

import {
  submitHumanReview,
} from "../services/humanReviewClient";

interface HumanReviewViewProps {
  cases: ShipmentCase[];

  onOpenCase:
    (caseId: string) => void;

  onRefreshCases:
    () =>
      | void
      | Promise<void>;

  onOpenVisionOcr?:
    (caseId: string) => void;

  initialCaseId?:
    string | null;
}

const FIELD_LABELS:
  Record<
    ComparisonField,
    string
  > = {
    shipper: "Shipper",
    consignee: "Consignee",
    notify_party:
      "Notify Party",
    port_of_loading:
      "Port of Loading",
    port_of_discharge:
      "Port of Discharge",
    container_count:
      "Container Count",
    gross_weight_kg:
      "Gross Weight (KG)",
  };

function reviewReasonText(
  reason:
    ShipmentCase["reviewReason"]
) {
  switch (reason) {
    case "missing_attachment":
      return "A required SI or BL attachment is missing.";

    case "unreadable":
      return "One or more required fields could not be read reliably.";

    case "missing_value":
      return "A required shipment value is missing.";

    case "wrong_doc_type":
      return "The expected SI/BL document pair could not be identified.";

    default:
      return "The case requires human verification.";
  }
}

export const HumanReviewView:
  React.FC<
    HumanReviewViewProps
  > = ({
    cases,
    onOpenCase,
    onRefreshCases,
    onOpenVisionOcr,
    initialCaseId,
  }) => {
    const [
      selectedCase,
      setSelectedCase,
    ] =
      useState<
        ShipmentCase | null
      >(null);

    const [
      overrideField,
      setOverrideField,
    ] =
      useState<ComparisonField>(
        "consignee"
      );

    const [
      overrideDocument,
      setOverrideDocument,
    ] =
      useState<
        "SI" | "BL"
      >("BL");

    const [
      overrideValue,
      setOverrideValue,
    ] = useState("");

    const [
      reviewerName,
      setReviewerName,
    ] =
      useState(
        "Human Reviewer"
      );

    const [
      decisionNotes,
      setDecisionNotes,
    ] = useState("");

    const [
      submitting,
      setSubmitting,
    ] =
      useState(false);

    const [
      error,
      setError,
    ] =
      useState<
        string | null
      >(null);

    const pendingReviewCases =
      useMemo(
        () =>
          cases.filter(
            (item) =>
              item
                .verificationStatus ===
                "NEEDS_REVIEW" ||
              (
                item.hasRevision &&
                item
                  .revisionComparison
                  ?.overallOutcome ===
                  "NEEDS_HUMAN_REVIEW"
              )
          ),
        [cases]
      );

    // ----------------------------------
    // Open requested case
    // ----------------------------------

    useEffect(() => {
      if (!initialCaseId) {
        return;
      }

      const match =
        pendingReviewCases.find(
          (item) =>
            item.id ===
            initialCaseId
        );

      if (match) {
        setSelectedCase(
          match
        );
      }
    }, [
      initialCaseId,
      pendingReviewCases,
    ]);

    // ----------------------------------
    // Select the first field that
    // actually requires review.
    //
    // No fake pre-filled value.
    // ----------------------------------

    useEffect(() => {
      if (!selectedCase) {
        return;
      }

      const reviewField =
        selectedCase
          .fieldComparisons
          ?.find(
            (comparison) =>
              comparison.status ===
              "NEEDS_REVIEW"
          );

      const defectField =
        selectedCase
          .defectFields
          ?.[0];

      const field =
        reviewField?.field ??
        defectField ??
        "consignee";

      setOverrideField(
        field
      );

      if (
        reviewField &&
        !reviewField.siEvidence
      ) {
        setOverrideDocument(
          "SI"
        );
      } else if (
        reviewField &&
        !reviewField.blEvidence
      ) {
        setOverrideDocument(
          "BL"
        );
      } else {
        setOverrideDocument(
          "BL"
        );
      }

      setOverrideValue("");
      setDecisionNotes("");
      setError(null);
    }, [selectedCase]);

    const activeComparison =
      selectedCase
        ?.fieldComparisons
        ?.find(
          (comparison) =>
            comparison.field ===
            overrideField
        );

    async function applyDecision(
      approvedStatus:
        | "OK"
        | "MISMATCH"
    ) {
      if (!selectedCase) {
        return;
      }

      if (
        !reviewerName.trim()
      ) {
        setError(
          "Reviewer name is required."
        );

        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        await submitHumanReview(
          selectedCase.id,
          {
            reviewer:
              reviewerName.trim(),

            approvedStatus,

            comments:
              decisionNotes.trim() ||
              undefined,

            manualOverride:
              overrideValue.trim()
                ? {
                    field:
                      overrideField,

                    documentType:
                      overrideDocument,

                    value:
                      overrideValue.trim(),
                  }
                : undefined,
          }
        );

        await onRefreshCases();

        setSelectedCase(
          null
        );

        setOverrideValue("");
        setDecisionNotes("");
      } catch (err: any) {
        setError(
          err?.message ||
            "Unable to save human review."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    }

    return (
      <div
        id="human-review-view"
        className="p-6 space-y-6 max-w-7xl mx-auto"
      >
        {/* Header */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">

              <UserCheck className="w-5 h-5 text-amber-600" />

              Human-in-the-Loop
              Review Queue
            </h1>

            <p className="text-xs text-slate-500 mt-0.5">
              Cases that cannot
              safely be resolved
              automatically are
              escalated for a
              recorded human
              decision.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">

            {
              pendingReviewCases.length
            }{" "}
            Awaiting Review
          </span>
        </div>

        {/* Queue */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {pendingReviewCases.map(
            (item) => (
              <div
                key={
                  item.id
                }
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-amber-400 transition"
              >
                <div>

                  <div className="flex items-start justify-between gap-2 mb-2">

                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">

                      {(
                        item.reviewReason ??
                        "revision_review"
                      )
                        .replace(
                          /_/g,
                          " "
                        )
                        .toUpperCase()}
                    </span>

                    <span className="text-xs font-bold text-slate-700">
                      Priority{" "}
                      {
                        item.priorityScore
                      }
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {
                      item.shipmentReference
                    }
                  </h3>

                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {
                      item.emailSubject
                    }
                  </p>

                  <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">

                    <div className="font-semibold text-slate-700 mb-1">
                      Review reason
                    </div>

                    <p className="text-slate-600">
                      {reviewReasonText(
                        item.reviewReason
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">

                  <button
                    onClick={() =>
                      onOpenCase(
                        item.id
                      )
                    }
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                  >
                    Inspect Case
                  </button>

                  <button
                    onClick={() =>
                      setSelectedCase(
                        item
                      )
                    }
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Review & Decide
                  </button>
                </div>
              </div>
            )
          )}

          {pendingReviewCases.length ===
            0 && (
            <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-slate-200 p-8">

              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />

              <h3 className="text-sm font-bold text-slate-900">
                Review Queue Clear
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                No case currently
                requires human
                review.
              </p>
            </div>
          )}
        </div>

        {/* Review modal */}

        {selectedCase && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">

            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">

              <div className="flex items-start justify-between border-b border-slate-200 pb-3">

                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">

                    <UserCheck className="w-4 h-4 text-amber-600" />

                    Human Review:{" "}
                    {
                      selectedCase
                        .shipmentReference
                    }
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Review source
                    evidence before
                    approving the
                    final decision.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedCase(
                      null
                    )
                  }
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reason */}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">

                <div className="flex gap-2">

                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      Why this case
                      needs review
                    </div>

                    <div className="text-[11px] text-amber-800 mt-1">
                      {reviewReasonText(
                        selectedCase
                          .reviewReason
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual evidence */}

              <div className="space-y-2">

                <div className="text-xs font-bold text-slate-800">
                  Field Evidence
                </div>

                <select
                  value={
                    overrideField
                  }
                  onChange={(e) =>
                    setOverrideField(
                      e.target
                        .value as ComparisonField
                    )
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                >
                  {COMPARISON_FIELDS.map(
                    (field) => (
                      <option
                        key={
                          field
                        }
                        value={
                          field
                        }
                      >
                        {
                          FIELD_LABELS[
                            field
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <div className="grid grid-cols-2 gap-2">

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">

                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      SI
                    </div>

                    <div className="text-xs font-mono text-slate-800 mt-1 break-words">
                      {
                        activeComparison
                          ?.siEvidence
                          ?.originalValue ??
                        "No readable value"
                      }
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">

                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      BL
                    </div>

                    <div className="text-xs font-mono text-slate-800 mt-1 break-words">
                      {
                        activeComparison
                          ?.blEvidence
                          ?.originalValue ??
                        "No readable value"
                      }
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onOpenCase(
                      selectedCase.id
                    )
                  }
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />

                  Open full SI vs BL
                </button>

                {onOpenVisionOcr &&
                  selectedCase.reviewReason ===
                    "unreadable" && (
                    <button
                      onClick={() =>
                        onOpenVisionOcr(
                          selectedCase.id
                        )
                      }
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />

                      Open Vision OCR
                    </button>
                  )}
              </div>

              {/* Optional manual correction */}

              <div className="border-t border-slate-200 pt-4 space-y-3">

                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Optional Manual
                    Correction
                  </div>

                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Only enter a
                    value if you
                    verified it from
                    the source
                    document.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setOverrideDocument(
                        "SI"
                      )
                    }
                    className={`text-xs p-2 rounded border ${
                      overrideDocument ===
                      "SI"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200"
                    }`}
                  >
                    Correct SI
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOverrideDocument(
                        "BL"
                      )
                    }
                    className={`text-xs p-2 rounded border ${
                      overrideDocument ===
                      "BL"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200"
                    }`}
                  >
                    Correct BL
                  </button>
                </div>

                <input
                  value={
                    overrideValue
                  }
                  onChange={(e) =>
                    setOverrideValue(
                      e.target.value
                    )
                  }
                  placeholder={`Verified ${FIELD_LABELS[overrideField]} value`}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Reviewer */}

              <div className="space-y-2">

                <label className="text-xs font-semibold text-slate-700">
                  Reviewer
                </label>

                <input
                  value={
                    reviewerName
                  }
                  onChange={(e) =>
                    setReviewerName(
                      e.target.value
                    )
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />

                <label className="text-xs font-semibold text-slate-700">
                  Decision Notes
                </label>

                <textarea
                  value={
                    decisionNotes
                  }
                  onChange={(e) =>
                    setDecisionNotes(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="State what evidence was reviewed and why this decision is appropriate."
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 resize-none"
                />
              </div>

              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                  {error}
                </div>
              )}

              {/* Decision */}

              <div className="border-t border-slate-200 pt-4">

                <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-500">

                  <ShieldCheck className="w-4 h-4 text-blue-600" />

                  Decision will be
                  persisted to the
                  case audit record.
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      void applyDecision(
                        "OK"
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg"
                  >
                    Approve as OK
                  </button>

                  <button
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      void applyDecision(
                        "MISMATCH"
                      )
                    }
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg"
                  >
                    Confirm Mismatch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };