import React, { useState, useEffect } from "react";
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
  Camera,
  GitCompare
} from "lucide-react";
import { ShipmentCase, ComparisonField } from "../types";
import { datasetProvider } from "../services/datasetProvider";

interface HumanReviewViewProps {
  cases: ShipmentCase[];
  onOpenCase: (caseId: string) => void;
  onRefreshCases: () => void;
  onOpenVisionOcr?: (caseId: string) => void;
  initialCaseId?: string | null; 
}

export const HumanReviewView: React.FC<HumanReviewViewProps> = ({
  cases,
  onOpenCase,
  onRefreshCases,
  onOpenVisionOcr,
  initialCaseId
}) => {
  const [selectedCase, setSelectedCase] = useState<ShipmentCase | null>(() => {
    if (initialCaseId) {
      return cases.find((c) => c.id === initialCaseId) || null;
    }
    return null;
  });

  const [overrideValue, setOverrideValue] = useState("");
  const [overrideField, setOverrideField] = useState<string>("consignee");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [reviewerName, setReviewerName] = useState("Sarah Tan (Senior Doc Specialist)");

  // Sync modal when initialCaseId is passed from RevisionView
  useEffect(() => {
    if (initialCaseId) {
      const target = cases.find((c) => c.id === initialCaseId);
      // Only auto-open if the case has NOT been reviewed yet!
      if (target && !target.humanReviewed) {
        setSelectedCase(target);
      }
    }
  }, [initialCaseId]); 

  // Dynamically set the correct target field and pre-fill values based on the case
  useEffect(() => {
    if (selectedCase) {
      if (selectedCase.hasRevision && selectedCase.revisionComparison?.unexpectedChanges?.length) {
        const unexpected = selectedCase.revisionComparison.unexpectedChanges[0];
        setOverrideField(unexpected.field);
        setOverrideValue(String(unexpected.siValue));
        setDecisionNotes(`Revision audit: Consignee modified unilaterally in BL V2. Reverting to intended SI value '${unexpected.siValue}'.`);
      } else if (selectedCase.reviewReason === "unreadable") {
        setOverrideField("gross_weight_kg");
        setOverrideValue("64,000 KG");
        setDecisionNotes("Optical scan verification: Digit 2 confirmed as 64,000 KG per SI reference.");
      } else if (selectedCase.reviewReason === "missing_value") {
        setOverrideField("consignee");
        setOverrideValue("");
        setDecisionNotes("Shipper preliminary SI omitted Consignee. Verified via customer booking profile.");
      } else if (selectedCase.defectFields && selectedCase.defectFields.length > 0) {
        setOverrideField(selectedCase.defectFields[0]);
        setOverrideValue("");
      } else {
        setOverrideField("consignee");
      }
    }
  }, [selectedCase]);

  const pendingReviewCases = cases.filter(
    (c) => c.verificationStatus === "NEEDS_REVIEW" || (c.hasRevision && c.revisionComparison?.overallOutcome === "NEEDS_HUMAN_REVIEW")
  );

  const handleApplyDecision = (approvedStatus: "OK" | "MISMATCH") => {
    if (!selectedCase) return;

    datasetProvider.updateHumanReview(selectedCase.id, {
      reviewer: reviewerName,
      approvedStatus,
      comments: decisionNotes || `Resolved as ${approvedStatus} by operator`,
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
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Revision Case Context Card (for SHP-7612) */}
            {selectedCase.hasRevision && (selectedCase.revisionComparison?.unexpectedChanges?.length ?? 0) > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs space-y-2">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-purple-600" />
                  <span>3-Way Revision Finding: Unauthorized Consignee Alteration</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  Carrier fixed weight and container count, but altered the Consignee company name on BL V2. Choose the authorized value:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const val = String(selectedCase.revisionComparison?.unexpectedChanges[0]?.siValue);
                      setOverrideField("consignee");
                      setOverrideValue(val);
                      setDecisionNotes(`Authorized original SI Consignee: ${val}`);
                    }}
                    className={`p-2.5 bg-white rounded-lg border text-left transition cursor-pointer ${
                      overrideValue === String(selectedCase.revisionComparison?.unexpectedChanges[0]?.siValue)
                        ? "border-purple-600 ring-2 ring-purple-100 shadow-xs"
                        : "border-purple-200 hover:bg-purple-100/50"
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-xs">Original SI (Customer Intended)</div>
                    <div className="font-mono text-[11px] text-purple-900 mt-0.5 truncate">
                      {String(selectedCase.revisionComparison?.unexpectedChanges[0]?.siValue)}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const val = String(selectedCase.revisionComparison?.unexpectedChanges[0]?.v2Value);
                      setOverrideField("consignee");
                      setOverrideValue(val);
                      setDecisionNotes(`Approved carrier amended Consignee: ${val}`);
                    }}
                    className={`p-2.5 bg-white rounded-lg border text-left transition cursor-pointer ${
                      overrideValue === String(selectedCase.revisionComparison?.unexpectedChanges[0]?.v2Value)
                        ? "border-purple-600 ring-2 ring-purple-100 shadow-xs"
                        : "border-purple-200 hover:bg-purple-100/50"
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-xs">Carrier BL V2 (Revised Draft)</div>
                    <div className="font-mono text-[11px] text-purple-900 mt-0.5 truncate">
                      {String(selectedCase.revisionComparison?.unexpectedChanges[0]?.v2Value)}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Optical Scan Smudge Proposals (for SHP-8411) */}
            {selectedCase.reviewReason === "unreadable" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-900">AI Optical Model Proposals:</div>
                  {onOpenVisionOcr && (
                    <button
                      onClick={() => onOpenVisionOcr(selectedCase.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs cursor-pointer"
                    >
                      <Camera className="w-3 h-3 text-indigo-600" />
                      <span>Launch AI Vision OCR Reader</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideField("gross_weight_kg");
                      setOverrideValue("64,000 KG");
                      setDecisionNotes("Optical smudge resolved: 64,000 KG confirmed per SI reference.");
                    }}
                    className={`p-2 bg-white border rounded text-left transition cursor-pointer ${
                      overrideValue === "64,000 KG" ? "border-amber-500 ring-2 ring-amber-100" : "border-amber-300 hover:bg-amber-100/50"
                    }`}
                  >
                    <div className="font-bold text-slate-900">Candidate A: 64,000 KG</div>
                    <div className="text-[10px] text-slate-500">Confidence: 58% (Matches SI)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideField("gross_weight_kg");
                      setOverrideValue("68,000 KG");
                      setDecisionNotes("Optical smudge resolved: 68,000 KG confirmed (discrepancy).");
                    }}
                    className={`p-2 bg-white border rounded text-left transition cursor-pointer ${
                      overrideValue === "68,000 KG" ? "border-amber-500 ring-2 ring-amber-100" : "border-amber-300 hover:bg-amber-100/50"
                    }`}
                  >
                    <div className="font-bold text-slate-900">Candidate B: 68,000 KG</div>
                    <div className="text-[10px] text-slate-500">Confidence: 42% (Discrepancy)</div>
                  </button>
                </div>
              </div>
            )}

            {/* Operator Form Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Name & Role</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Confirmed Field Value Override
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Target Field: <strong className="text-blue-700">{overrideField}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder="e.g. 64,000 KG or PACIFIC INDUSTRIAL TRADING LTD"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reasoning / Verification Notes</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Explain optical verification evidence, telephone confirmation, or authorization basis..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyDecision("MISMATCH")}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Confirm Mismatch & Request Amendment
                </button>
                <button
                  type="button"
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