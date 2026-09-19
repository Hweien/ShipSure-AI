import React, { useState } from "react";
import { 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  X,
  Camera
} from "lucide-react";
import { ShipmentCase } from "../types";
import { datasetProvider } from "../services/datasetProvider";

interface HumanReviewViewProps {
  cases: ShipmentCase[];
  onOpenCase: (caseId: string) => void;
  onRefreshCases: () => void;
  onOpenVisionOcr?: (caseId: string) => void;
}

export const HumanReviewView: React.FC<HumanReviewViewProps> = ({
  cases,
  onOpenCase,
  onRefreshCases,
  onOpenVisionOcr
}) => {
  const [selectedCase, setSelectedCase] = useState<ShipmentCase | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideField, setOverrideField] = useState("gross_weight_kg");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [reviewerName, setReviewerName] = useState("Sarah Tan (Senior Doc Specialist)");

  const pendingReviewCases = cases.filter(
    (c) => c.verificationStatus === "NEEDS_REVIEW" || (c.hasRevision && c.revisionComparison?.overallOutcome === "NEEDS_HUMAN_REVIEW")
  );

  const handleApplyDecision = (approvedStatus: "OK" | "MISMATCH") => {
    if (!selectedCase) return;

    datasetProvider.updateHumanReview(selectedCase.id, {
      reviewer: reviewerName,
      approvedStatus,
      comments: decisionNotes || `Approved as ${approvedStatus} after optical review`,
      manualOverrides: overrideValue ? { [overrideField]: overrideValue } : undefined
    });

    onRefreshCases();
    setSelectedCase(null);
    setOverrideValue("");
    setDecisionNotes("");
  };

  return (
    <div id="human-review-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            Human-in-the-Loop Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero-Guess Guarantee: When source documents are unreadable, missing fields, or uncertain, cases escalate here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {pendingReviewCases.length} Cases Awaiting Operator Decision
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingReviewCases.map((c) => {
          const reasonLabel = c.reviewReason
            ? c.reviewReason.replace(/_/g, " ").toUpperCase()
            : "UNEXPECTED MODIFICATION";

          return (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-amber-400 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {reasonLabel}
                  </span>
                  <span className="text-xs font-bold text-slate-700">Priority {c.priorityScore}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{c.shipmentReference}</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{c.emailSubject}</p>

                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-700">AI Validation Reason:</div>
                  <p className="text-slate-600 leading-snug">
                    {c.reviewReason === "missing_attachment" && "Shipping Instruction (SI) attachment was missing from carrier email."}
                    {c.reviewReason === "unreadable" && "Optical scan smudge on Gross Weight. Ambiguity between 64,000 KG (58%) and 68,000 KG (42%)."}
                    {c.reviewReason === "missing_value" && "Mandatory consignee field was left blank in shipper's preliminary document."}
                    {!c.reviewReason && "Carrier altered Consignee legal name during BL V2 re-issue."}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onOpenCase(c.id)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                >
                  Inspect Case
                </button>
                <button
                  onClick={() => setSelectedCase(c)}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Review & Decide
                </button>
              </div>
            </div>
          );
        })}

        {pendingReviewCases.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Review Queue Clear!</h3>
            <p className="text-xs text-slate-500 mt-1">All incoming shipments have either verified clean or have confirmed carrier discrepancies.</p>
          </div>
        )}
      </div>

      {/* Review Decision Action Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  Human Decision Override: {selectedCase.shipmentReference}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your decision is permanently appended to the immutable case audit passport.
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case specific optical suggestions */}
            {selectedCase.reviewReason === "unreadable" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-900">AI Optical Model Proposals:</div>
                  {onOpenVisionOcr && (
                    <button
                      onClick={() => onOpenVisionOcr(selectedCase.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs"
                    >
                      <Camera className="w-3 h-3 text-indigo-600" />
                      <span>Launch AI Vision OCR Reader</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOverrideValue("64,000 KG")}
                    className="p-2 bg-white border border-amber-300 rounded text-left hover:bg-amber-100/50 transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">Candidate A: 64,000 KG</div>
                    <div className="text-[10px] text-slate-500">Confidence: 58% (Matches SI)</div>
                  </button>
                  <button
                    onClick={() => setOverrideValue("68,000 KG")}
                    className="p-2 bg-white border border-amber-300 rounded text-left hover:bg-amber-100/50 transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">Candidate B: 68,000 KG</div>
                    <div className="text-[10px] text-slate-500">Confidence: 42% (Discrepancy)</div>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Name & Role</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirmed Field Value (Optional Override)</label>
                <input
                  type="text"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder="e.g. 64,000 KG or ROTTERDAM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reasoning / Verification Notes</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Explain optical verification evidence, telephone confirmation, or authorization basis..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyDecision("MISMATCH")}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Confirm Mismatch & Request Amendment
                </button>
                <button
                  onClick={() => handleApplyDecision("OK")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Approve as Matching (Clear Release)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
