import React, { useState } from "react";
import { 
  Inbox, 
  FileCheck2, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  PlayCircle, 
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { GlobalDateFilter, ShipmentCase } from "../types";

interface DashboardViewProps {
  cases: ShipmentCase[];
  dateFilter: GlobalDateFilter;
  onNavigate: (tab: string, caseId?: string) => void;
  onStartPriority: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  dateFilter,
  onNavigate,
  onStartPriority
}) => {
  const [briefingGenerating, setBriefingGenerating] = useState(false);
  const [customBriefing, setCustomBriefing] = useState<string | null>(null);

 // Filter cases based on the selected date filter
  const filteredCases = cases.filter((c) => {
    if (dateFilter.preset === "TODAY") {
      return c.receivedDate.startsWith("2026-09-19");
    } else if (dateFilter.preset === "YESTERDAY") {
      return c.receivedDate.startsWith("2026-09-18");
    } else if (dateFilter.preset === "LAST_7_DAYS" || dateFilter.preset === "THIS_MONTH") {
      return true; // includes all 12 demo emails
    }
    return true;
  });

  const totalEmails = filteredCases.length;
  const verifiedDocs = filteredCases.filter((c) => c.category === "BL_COMPARISON").length;
  const mismatches = filteredCases.filter((c) => c.verificationStatus === "MISMATCH").length;
  const humanReviews = filteredCases.filter((c) => c.verificationStatus === "NEEDS_REVIEW").length;
  const autoVerified = filteredCases.filter((c) => c.verificationStatus === "OK").length;
  const autoRate = verifiedDocs > 0 ? Math.round((autoVerified / verifiedDocs) * 100) : 0;

  // High priority cases needing attention
  const attentionCases = filteredCases
    .filter((c) => c.verificationStatus === "MISMATCH" || c.verificationStatus === "NEEDS_REVIEW" || c.hasRevision)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 4);

  const handleGenerateBriefing = () => {
    setBriefingGenerating(true);
    setTimeout(() => {
      setBriefingGenerating(false);
      setCustomBriefing(
        `Operational Briefing for ${dateFilter.preset}: Today our multi-agent pipeline processed ${totalEmails} incoming messages. ${verifiedDocs} document-check requests were evaluated. We caught ${mismatches} genuine carrier discrepancies before draft BL finalization. ${humanReviews} uncertain cases were escalated to Human Review without guessing. Priority focus: SHP-8291 container/weight defect and SHP-7612 unexpected consignee revision.`
      );
    }, 600);
  };

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Greeting & Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Good morning, Operations Lead
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here is your live shipping document verification overview for <span className="font-semibold text-slate-700">{dateFilter.preset.replace(/_/g, " ")}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartPriority}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Priority Queue</span>
          </button>
        </div>
      </div>

      {/* AI Morning / Period Briefing Card */}
      <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-sm border border-blue-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Operations Briefing</h2>
              <p className="text-[11px] text-blue-200">Synthesized from current operational inbox & verification evidence</p>
            </div>
          </div>
          <button
            onClick={handleGenerateBriefing}
            disabled={briefingGenerating}
            className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
          >
            {briefingGenerating ? "Synthesizing..." : "Refresh Briefing"}
          </button>
        </div>

        <p className="text-xs text-blue-100 mt-3 leading-relaxed">
          {customBriefing || (
            <>
              <strong>3 urgent document discrepancies</strong> require carrier amendments. 
              <strong> 3 cases</strong> awaiting human optical confirmation (zero-guess rule enforced). 
              <strong> 1 revised draft BL</strong> received with an unexpected legal entity modification. 
              Carrier vessel loading cutoff for flagship failure <strong>SHP-8291</strong> is in 12 hours.
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs text-blue-200">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            {mismatches} Confirmed Discrepancies
          </span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-300" />
            {humanReviews} Zero-Guess Escalations
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            {autoVerified} Auto-Verified Clean
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Emails Processed</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalEmails}</div>
          <p className="text-[11px] text-slate-400 mt-1">Inbox messages ingested</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Documents Verified</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{verifiedDocs}</div>
          <p className="text-[11px] text-slate-400 mt-1">SI vs Draft BL pairs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Mismatches Caught</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{mismatches}</div>
          <p className="text-[11px] text-slate-400 mt-1">Defects flagged to carrier</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Human Reviews</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{humanReviews}</div>
          <p className="text-[11px] text-slate-400 mt-1">Zero-guess escalation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Auto-Clear Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{autoRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">No human touches needed</p>
        </div>
      </div>

      {/* Main Split: Needs Your Attention Queue & Multi-Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Your Attention (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Needs Your Attention</h3>
                <p className="text-xs text-slate-500">Sorted by smart operational risk priority score</p>
              </div>
              <button
                onClick={() => onNavigate("shipments")}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View all cases <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {attentionCases.map((c) => {
                const isCritical = c.priorityScore >= 90;
                const isReview = c.verificationStatus === "NEEDS_REVIEW";
                const isRevision = c.hasRevision;

                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigate("shipments", c.id)}
                    className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCritical ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                            Critical
                          </span>
                        ) : isReview ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Review
                          </span>
                        ) : isRevision ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                            Revised BL
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Check
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{c.shipmentReference}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600 truncate max-w-xs">{c.emailSubject}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {c.priorityReasons[0] || "Discrepancies identified during SI comparison"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">
                          {c.priorityScore} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Risk Score</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Score includes confirmed defect count, cutoff times & revision status.</span>
            <button
              onClick={onStartPriority}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              Launch Priority Triage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-Agent Collaboration Live Status (1 col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Multi-Agent System</h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                8 Active Agents
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Autonomous execution trail on current cases:</p>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="font-semibold text-slate-800">Inbox Intelligence Agent</div>
                  <p className="text-[11px] text-slate-500">Triage: 12 emails classified into 5 categories</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="font-semibold text-slate-800">Document Intelligence Agent</div>
                  <p className="text-[11px] text-slate-500">Extracted 7 fields with unit normalization (MT → KG)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="font-semibold text-slate-800">Verification & Validation Agents</div>
                  <p className="text-[11px] text-slate-500">Deterministic checks + Zero-Guess optical critic gate</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="font-semibold text-slate-800">Revision Intelligence Agent</div>
                  <p className="text-[11px] text-slate-500">3-way diff caught unsolicited Consignee change on V2</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate("agents")}
              className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-semibold py-1 flex items-center justify-center gap-1"
            >
              Open Full Decision Passport Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
