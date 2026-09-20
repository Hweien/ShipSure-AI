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

import { ShipmentCase } from "../types";
import { findSimilarCases } from "../services/agents";

interface WatchdogViewProps {
  cases: ShipmentCase[];
}

export const WatchdogView: React.FC<WatchdogViewProps> = ({ cases }) => {
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
    mostFrequentField && mostFrequentField[1] > 0
      ? fieldLabels[mostFrequentField[0]]
      : null;

  const mostFrequentFieldCount =
    mostFrequentField && mostFrequentField[1] > 0
      ? mostFrequentField[1]
      : 0;

  const agentStages = [
    {
      name: "Email Classification Agent",
      details: "Classifies incoming shipment emails and identifies relevant email categories.",
    },
    {
      name: "Document Extraction Agent",
      details: "Reads shipment attachments and extracts document content from SI and BL files.",
    },
    {
      name: "Document Identification Agent",
      details: "Identifies whether uploaded documents are Shipping Instructions, Bills of Lading, or other documents.",
    },
    {
      name: "Field Extraction Agent",
      details: "Extracts the seven required shipment fields from identified documents.",
    },
    {
      name: "Verification Agent",
      details: "Compares the extracted SI and BL information and produces the shipment verification result.",
    },
  ];

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
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
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

      {/* Multi-Agent Live Collaboration Pipeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              Multi-Agent Collaboration Trace
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sequence of coordinated specialized agents processing incoming documents
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
            Processing Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {agentStages.map((stage, index) => (
              <div
                key={stage.name}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 relative"
              >
                <div className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  {index + 1}. {stage.name}
                </div>

                <p className="text-slate-600 leading-snug">
                  {stage.details}
                </p>
              </div>
            ))}
          </div>
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
                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
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
  </div>
  );
};
