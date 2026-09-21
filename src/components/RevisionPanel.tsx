import React from "react";

import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import {
  ShipmentCase,
} from "../types";

interface RevisionPanelProps {
  shipmentCase:
    ShipmentCase;

  onNavigateToHumanReview:
    (caseId: string) => void;
}

export const RevisionPanel:
  React.FC<RevisionPanelProps> = ({
    shipmentCase,
    onNavigateToHumanReview,
  }) => {
    const c =
      shipmentCase;

    const rev =
      c.revisionComparison;

    // --------------------------------------------------
    // Only show the full panel when a real revision
    // exists for this shipment.
    // --------------------------------------------------

    if (
      !c.hasRevision ||
      !rev
    ) {
      return null;
    }

    const correctedCount =
      rev.correctedFields.filter(
        (field) =>
          field.status ===
          "CORRECTED"
      ).length;

    const stillMismatchCount =
      rev.correctedFields.filter(
        (field) =>
          field.status ===
          "STILL_MISMATCH"
      ).length;

    const requiresReview =
      rev.overallOutcome !==
      "RESOLVED";

    return (
      <section
        id="version-intelligence-panel"
        className="bg-white border border-indigo-200 rounded-xl shadow-2xs overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-indigo-50/60 border-b border-indigo-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-600" />

                <h2 className="text-sm font-bold text-slate-900">
                  Version Intelligence
                </h2>

                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                  FUTURE EXTENSION
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Experimental re-verification of a revised Bill of
                Lading against the original SI and previous BL version.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200">
                BL V{c.blVersion ?? 2}
              </span>

              {requiresReview && (
                <button
                  onClick={() =>
                    onNavigateToHumanReview(
                      c.id
                    )
                  }
                  className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-2 rounded-lg transition"
                >
                  <UserCheck className="w-4 h-4" />
                  Human Review
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Revision shipment */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white">
          <div className="text-xs font-bold text-slate-900">
            {c.shipmentReference}
          </div>

          <div className="text-[11px] text-slate-500 mt-0.5">
            {c.emailSubject}
          </div>
        </div>

        {/* Outcome */}
        <div
          className={`p-4 border-b text-xs flex items-center justify-between ${
            rev.overallOutcome ===
            "RESOLVED"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2">

            {rev.overallOutcome ===
            "RESOLVED" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            )}

            <span>
              <strong>
                Outcome:
              </strong>{" "}

              {correctedCount}
              {" "}corrected •{" "}

              {stillMismatchCount}
              {" "}still mismatched •{" "}

              {
                rev
                  .unexpectedChanges
                  .length
              }
              {" "}unexpected changes
            </span>
          </div>

          <span className="font-semibold">
            {rev.overallOutcome ===
            "RESOLVED"
              ? "Resolved"
              : "Human Review Required"}
          </span>
        </div>

        {/* 3-way matrix */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">

            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              SI ↔ BL V1 ↔ BL V2
            </h3>

            <span className="text-[10px] text-slate-400">
              Experimental version reconciliation
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">

            <table className="w-full text-left border-collapse">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">

                  <th className="py-2.5 px-4">
                    Field
                  </th>

                  <th className="py-2.5 px-4 text-blue-700">
                    SI
                  </th>

                  <th className="py-2.5 px-4">
                    BL V1
                  </th>

                  <th className="py-2.5 px-4 text-indigo-700">
                    BL V2
                  </th>

                  <th className="py-2.5 px-4">
                    Result
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {rev.correctedFields.map(
                  (
                    field,
                    index
                  ) => (
                    <tr
                      key={`corrected-${index}`}
                      className="hover:bg-slate-50"
                    >

                      <td className="py-3 px-4 font-semibold text-slate-900 capitalize">
                        {
                          field.field
                            .replace(
                              /_/g,
                              " "
                            )
                        }
                      </td>

                      <td className="py-3 px-4 font-mono text-blue-900">
                        {
                          String(
                            field.siValue
                          )
                        }
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {
                          String(
                            field.v1Value
                          )
                        }
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {
                          String(
                            field.v2Value
                          )
                        }
                      </td>

                      <td className="py-3 px-4">

                        {field.status ===
                        "CORRECTED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            CORRECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            STILL MISMATCH
                          </span>
                        )}

                      </td>
                    </tr>
                  )
                )}

                {rev.unexpectedChanges.map(
                  (
                    field,
                    index
                  ) => (
                    <tr
                      key={`unexpected-${index}`}
                      className="bg-red-50/40"
                    >

                      <td className="py-3 px-4 font-bold text-red-900 capitalize">
                        {
                          field.field
                            .replace(
                              /_/g,
                              " "
                            )
                        }
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {
                          String(
                            field.siValue
                          )
                        }
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {
                          String(
                            field.v1Value
                          )
                        }
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-red-700">
                        {
                          String(
                            field.v2Value
                          )
                        }
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          UNEXPECTED CHANGE
                        </span>
                      </td>

                    </tr>
                  )
                )}

              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">

            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Version Intelligence Summary
            </div>

            <p className="text-slate-600 leading-relaxed">
              {rev.overallOutcome ===
              "RESOLVED"
                ? `The revised BL resolves all tracked discrepancies. ${correctedCount} field(s) were corrected successfully.`
                : `The revised BL requires review. ${stillMismatchCount} field(s) remain mismatched and ${rev.unexpectedChanges.length} unexpected change(s) were detected.`}
            </p>

          </div>
        </div>
      </section>
    );
  };