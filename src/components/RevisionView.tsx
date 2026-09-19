import React from "react";
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck, 
  FileText,
  ShieldAlert,
  Clock
} from "lucide-react";
import { ShipmentCase } from "../types";

interface RevisionViewProps {
  cases: ShipmentCase[];
  onOpenCase: (caseId: string) => void;
  onNavigateToHumanReview: () => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  cases,
  onOpenCase,
  onNavigateToHumanReview
}) => {
  const revisionCases = cases.filter((c) => c.hasRevision);

  return (
    <div id="revision-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-600" />
            Revision Intelligence (BL V1 vs V2 vs SI)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated 3-way re-verification: validates whether requested carrier corrections were resolved, and catches unauthorized field modifications.
          </p>
        </div>
      </div>

      {/* Revision Case Cards */}
      <div className="space-y-6">
        {revisionCases.map((c) => {
          const rev = c.revisionComparison;
          if (!rev) return null;

          return (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
            >
              {/* Card Header */}
              <div className="p-5 bg-purple-50/50 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-900">{c.shipmentReference}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Revised Draft Received
                    </span>
                    <span className="text-xs text-slate-500">• {c.emailSubject}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Carrier submitted Bill of Lading Version 2 in response to previous amendment notice.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCase(c.id)}
                    className="text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    View SI vs BL
                  </button>
                  <button
                    onClick={onNavigateToHumanReview}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Send to Review Desk
                  </button>
                </div>
              </div>

              {/* Status Outcome Banner */}
              <div className="p-4 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <strong>Outcome:</strong> {rev.correctedFields.length} requested corrections completed •{" "}
                    <span className="text-red-700 font-bold">
                      {rev.unexpectedChanges.length} unexpected modification detected
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-amber-200/70 px-2 py-0.5 rounded text-amber-900">
                  Human Review Required
                </span>
              </div>

              {/* 3-Way Diff Matrix */}
              <div className="p-5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  3-Way Version Comparison Matrix
                </h3>

                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 px-4">Field</th>
                        <th className="py-2.5 px-4 text-blue-700">SI (Intended)</th>
                        <th className="py-2.5 px-4 text-slate-600">BL V1 (Original Draft)</th>
                        <th className="py-2.5 px-4 text-purple-800">BL V2 (Revised Draft)</th>
                        <th className="py-2.5 px-4">Diff Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Corrected fields */}
                      {rev.correctedFields.map((cf, i) => (
                        <tr key={i} className="hover:bg-emerald-50/20">
                          <td className="py-3 px-4 font-semibold text-slate-900 capitalize">
                            {cf.field.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-4 font-mono text-blue-900">{String(cf.siValue)}</td>
                          <td className="py-3 px-4 font-mono text-slate-500 line-through">{String(cf.v1Value)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">{String(cf.v2Value)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              CORRECTED
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Unexpected changes */}
                      {rev.unexpectedChanges.map((uc, i) => (
                        <tr key={i} className="bg-red-50/40">
                          <td className="py-3 px-4 font-bold text-red-900 capitalize">
                            {uc.field.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-4 font-mono text-blue-900">{String(uc.siValue)}</td>
                          <td className="py-3 px-4 font-mono text-slate-700">{String(uc.v1Value)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-red-700 bg-red-100/50 px-2 rounded">
                            {String(uc.v2Value)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              UNEXPECTED CHANGE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Explanation Callout */}
                <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Revision Agent Forensic Summary:
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    The carrier successfully corrected the Container Count from 4 to 3 and the Gross Weight from 19,500 KG to 18,200 KG. However, during re-drafting, the Consignee was altered from <strong>"PACIFIC INDUSTRIAL TRADING LTD"</strong> to <strong>"PACIFIC INDUSTRIAL LOGISTICS GROUP LTD"</strong>. Since this was not requested, the release must remain on hold until authorized.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
