import React from "react";
import { 
  ShieldAlert, 
  Sparkles, 
  BrainCircuit, 
  Layers, 
  History, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

import { ShipmentCase, ComparisonField } from "../types";
import { findSimilarCases } from "../services/agents";

interface WatchdogViewProps {
  cases: ShipmentCase[];
}

export const WatchdogView: React.FC<WatchdogViewProps> = ({ cases }) => {
  const [selectedCase, setSelectedCase] = React.useState<ShipmentCase | null>(null);
  const [selectedPatternCases, setSelectedPatternCases] = React.useState<ShipmentCase[]>([]);
  const fieldCounts: Record<string, number> = {
    container_count: 0,
    gross_weight_kg: 0,
    port_of_discharge: 0,
    port_of_loading: 0,
    shipper: 0,
    consignee: 0,
    notify_party: 0,
  };

  (cases ?? []).forEach((c) => {
    c.defectFields?.forEach((field) => {
      if (fieldCounts[field] !== undefined) {
        fieldCounts[field]++;
      }
    });
  });

  const fieldLabels: Record<string, string> = {
    container_count: "Container Count",
    gross_weight_kg: "Gross Weight",
    port_of_discharge: "Port of Discharge",
    port_of_loading: "Port of Loading",
    shipper: "Shipper",
    consignee: "Consignee",
    notify_party: "Notify Party",
  };

  // Finds the field with the highest number of defects 
  const mostFrequentField = Object.entries(fieldCounts)
    .sort((a, b) => b[1] - a[1])[0];

  // Safely handles the situation where there are no defects 
  const mostFrequentFieldName =
    mostFrequentField && mostFrequentField[1] >= 2
        ? fieldLabels[mostFrequentField[0]]
        : null;

  const mostFrequentFieldCount =
    mostFrequentField && mostFrequentField[1] >= 2
      ? mostFrequentField[1]
      : 0;

  const activeMemoryCase = [...(cases ?? [])]
    .filter((c) => c.hasDefect)
    .sort(
      (a, b) =>
        new Date(b.receivedDate).getTime() -
        new Date(a.receivedDate).getTime()
    )[0];

  const similarCases = activeMemoryCase
    // Search for similar shipment cases and keep the top 2
    ? findSimilarCases(activeMemoryCase, cases).slice(0, 2)
    : [];

  return (
    <div id="watchdog-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          Proactive Watchdog & Long-Term Memory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Autonomous pattern detection across historical shipments, recurrent carrier clerical errors, and institutional learning memory.
        </p>
      </div>

      {/* Anomaly Pattern Alerts */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Detected Systematic Operational Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mostFrequentFieldName ? (
            <div
              onClick={() => {
                const field = mostFrequentField?.[0] as ComparisonField | undefined;

                if (!field) return;

                const matchingCases = (cases ?? []).filter((c) =>
                  c.defectFields?.includes(field)
                );

                setSelectedPatternCases(matchingCases);
              }}

              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition"
              >
            
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Pattern Detected
                </span>

                <span className="text-[11px] font-semibold text-slate-500">
                  {mostFrequentFieldCount} Field Defects
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Recurring {mostFrequentFieldName} Discrepancies
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {mostFrequentFieldName} is currently the most frequently recorded
                discrepancy field across the processed shipment cases.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                  <strong>Recommended Action:</strong> Review{" "}
                  {mostFrequentFieldName} discrepancies for recurring operational
                  causes.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900">
                No Recurring Pattern Detected
              </h3>

            <p className="text-xs text-slate-600 mt-2">
              No discrepancy pattern has been identified from the current shipment
              cases.
            </p>
          </div>
        )}
      </div>   

      {/* Institutional Memory & Similar Case Retrieval */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-indigo-600" />
          Institutional Memory & Similar Case Retrieval
        </h2>

        <div className="space-y-3 text-xs">
          {similarCases.length > 0 ? (
            similarCases.map((similarCase) => (
              <div
                key={similarCase.caseId}
                onClick={() => {
                  const matchingCase = (cases ?? []).find(
                    (c) => c.shipmentReference === similarCase.shipmentReference
                  );

                  if (matchingCase) {
                    setSelectedCase(matchingCase);
                  }
                }}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                <div className="font-bold text-slate-800">
                  Similar Case: {similarCase.shipmentReference}
                </div>

                <p className="text-slate-600 mt-0.5">
                  {similarCase.matchReason}
                </p>

                <div className="text-[10px] text-slate-400 mt-1">
                   Previous outcome: {similarCase.finalHumanDecision} •{" "}
                  {similarCase.date} • Similarity: {similarCase.similarityScore}%
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800">
                No Similar Previous Cases
              </div>

              <p className="text-slate-600 mt-0.5">
                No sufficiently similar historical shipment cases were found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
            {selectedPatternCases.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {mostFrequentFieldName} Discrepancy Cases
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPatternCases.length} affected case
                  {selectedPatternCases.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <button
                onClick={() => setSelectedPatternCases([])}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedPatternCases.map((caseItem) => (
                <div
                  key={caseItem.emailId}
                  onClick={() => {
                    setSelectedPatternCases([]);
                    setSelectedCase(caseItem);
                  }}
                  className="p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {caseItem.shipmentReference || caseItem.emailId}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Email: {caseItem.emailId}
                      </p>
                    </div>

                    <span className="text-xs font-medium text-red-600">
                      {caseItem.verificationStatus}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {caseItem.defectFields?.map((field) => (
                      <span
                        key={field}
                        className="rounded-full bg-red-50 px-2 py-1 text-[11px] text-red-700"
                      >
                        {fieldLabels[field] || field}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Shipment Case Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedCase.shipmentReference}
                </p>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Email ID
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedCase.emailId}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedCase.verificationStatus}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Shipment Reference
                </p>
                <p className="text-sm text-slate-800">
                  {selectedCase.shipmentReference || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Defect Fields
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCase.defectFields?.length ? (
                    selectedCase.defectFields.map((field) => (
                      <span
                        key={field}
                        className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-100"
                      >
                        {fieldLabels[field] || field}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No defect fields
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Received Date
                </p>
                <p className="text-sm text-slate-800">
                  {selectedCase.receivedDate
                    ? new Date(selectedCase.receivedDate).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
