import React, { useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Cpu, 
  Search,
  ChevronRight,
  Printer
} from "lucide-react";
import { defaultAgentTraces } from "../services/syntheticData";
import { ShipmentCase } from "../types";

interface AgentActivityViewProps {
  cases: ShipmentCase[];
  onOpenCase: (caseId: string) => void;
}

export const AgentActivityView: React.FC<AgentActivityViewProps> = ({
  cases,
  onOpenCase
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "CASE-8291");
  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <div id="agent-activity-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Agent Activity Traces & AI Decision Passport
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete, defensible operational audit trail with step-by-step reasoning chains for legal and compliance verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Multi-Agent Trace Log */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Autonomous Execution Trail</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Live Stream
            </span>
          </h2>

          <div className="space-y-3">
            {defaultAgentTraces.map((trace) => (
              <div
                key={trace.id}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 transition text-xs space-y-1 bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>{trace.agentName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      • Case {trace.caseId}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(trace.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>

                <div className="font-semibold text-slate-700 text-[11px] mt-1">
                  Action: {trace.action}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {trace.details}
                </p>

                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    STATUS: {trace.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCaseId(trace.caseId);
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View Case Passport
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Formal AI Decision Passport */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    AI Decision Passport
                  </h3>
                  <p className="text-[10px] text-slate-500">Official verification record</p>
                </div>
              </div>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 text-slate-800"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shipmentReference}
                  </option>
                ))}
              </select>
            </div>

            {activeCase && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 font-medium">Passport Identifier</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    PASSPORT-SHP-{activeCase.id.replace("CASE-", "")}-V{activeCase.blVersion}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Timestamp: {new Date().toISOString()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold text-slate-700">Verification Outcome:</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    {activeCase.verificationStatus === "MISMATCH" ? (
                      <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                        Defects Confirmed (Hold)
                      </span>
                    ) : activeCase.verificationStatus === "NEEDS_REVIEW" ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        Human Review Escalation
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        Autonomous Clean Release
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-slate-700">Deterministic Rule Engine Hash:</div>
                  <div className="font-mono text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded truncate">
                    sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-slate-700">Normalized Fields Audited:</div>
                  <div className="text-slate-600 text-[11px]">
                    7 of 7 core fields cross-checked (Gross Weight, Container Count, Shipper, Consignee, Notify Party, POL, POD).
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
                  <strong>Defensibility Guarantee:</strong> Every extracted figure is grounded in verbatim source snippets with calculated conversion evidence.
                </div>
              </div>
            )}
          </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => onOpenCase(activeCase.id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Inspect SI vs BL <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => window.print()}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
