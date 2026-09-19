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
import { defaultAnomalyAlerts, defaultAgentTraces } from "../services/syntheticData";

export const WatchdogView: React.FC = () => {
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
          {defaultAnomalyAlerts.map((alert) => {
            const isHigh = alert.severity === "HIGH";
            return (
              <div
                key={alert.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isHigh
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {alert.severity} Risk
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {alert.affectedShipments.length} Cases Affected
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    <strong>Recommended Policy:</strong> {alert.recommendedAction}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
            Real-Time Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 relative">
            <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              1. Analytics Agent
            </div>
            <p className="text-slate-600 leading-snug">
              Monitors inbox volume spikes, historical carrier defect rates, and vessel cutoff schedules.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 relative">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              2. Document Agent
            </div>
            <p className="text-slate-600 leading-snug">
              Normalizes units (MT to KG), resolves port acronyms, and standardizes corporate entity names.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 relative">
            <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              3. Pattern Agent
            </div>
            <p className="text-slate-600 leading-snug">
              Detects repeated carrier habits, identical typos, and cross-shipment container reuse errors.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 relative">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              4. Validation Agent
            </div>
            <p className="text-slate-600 leading-snug">
              Enforces the Zero-Guess Gate: escalates unreadable scans directly to human review without hallucinating.
            </p>
          </div>
        </div>
      </div>

      {/* Institutional Memory & Similar Case Retrieval */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-indigo-600" />
          Institutional Memory Retrieval (Vector Knowledge)
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <div className="font-bold text-slate-800">Entity Resolution Rule #419</div>
              <p className="text-slate-600 mt-0.5">
                "GLOBAL TECH LOGISTICS PTE LTD" and "GLOBAL TECH LOGISTICS SINGAPORE" represent the same legal beneficiary under Master Booking agreement #MS-881.
              </p>
              <div className="text-[10px] text-slate-400 mt-1">Confirmed by Operator on Aug 14, 2026 • Reused in 4 shipments</div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold shrink-0">
              Active Memory
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <div className="font-bold text-slate-800">Port Alias Rule #102</div>
              <p className="text-slate-600 mt-0.5">
                "PORT KLANG", "PKL", "PORT KELANG", "MYPKG" are normalized automatically to Port Klang (MYPKG, Malaysia).
              </p>
              <div className="text-[10px] text-slate-400 mt-1">System Standard • Verified 100% accuracy</div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold shrink-0">
              Active Memory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
