import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  GitCompare,
  UserCheck, 
  Sparkles, 
  Bot, 
  Mail, 
  Copy, 
  Check, 
  FileText, 
  ChevronRight,
  X,
  Camera
} from "lucide-react";
import { ComparisonField, ShipmentCase, SingleFieldComparison } from "../types";
import { RevisionPanel } from "./RevisionPanel";

interface VerificationViewProps {
  shipmentCase: ShipmentCase;
  onBack: () => void;
  onAskCopilot: (caseObj: ShipmentCase) => void;
  onSendToHumanReview: (caseId: string) => void;
  onOpenVisionOcr?: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  shipmentCase,
  onBack,
  onAskCopilot,
  onSendToHumanReview,
  onOpenVisionOcr
}) => {
  const [activeEvidence, setActiveEvidence] = useState<SingleFieldComparison | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [draftSubject, setDraftSubject] = useState(
    shipmentCase.draftResolution?.subject || `BL Amendment Required – Shipment ${shipmentCase.shipmentReference}`
  );
  const [draftBody, setDraftBody] = useState(shipmentCase.draftResolution?.body || "");
  const [copied, setCopied] = useState(false);
  const [draftApproved, setDraftApproved] = useState(shipmentCase.draftResolution?.status === "APPROVED");

  // ✅ Keep draft email synchronized whenever a different shipment is selected
  useEffect(() => {
    setDraftSubject(
      shipmentCase.draftResolution?.subject ||
        `BL Amendment Required – Shipment ${shipmentCase.shipmentReference}`
    );
    setDraftBody(shipmentCase.draftResolution?.body || "");
    setDraftApproved(shipmentCase.draftResolution?.status === "APPROVED");
  }, [shipmentCase]);

  // Ensure all 7 mandatory fields exist in the rows
  const MANDATORY_KEYS: { key: ComparisonField; label: string }[] = [
    { key: "shipper", label: "Shipper" },
    { key: "consignee", label: "Consignee" },
    { key: "notify_party", label: "Notify Party" },
    { key: "port_of_loading", label: "Port of Loading" },
    { key: "port_of_discharge", label: "Port of Discharge" },
    { key: "container_count", label: "Container Count" },
    { key: "gross_weight_kg", label: "Gross Weight (KG)" },
  ];

  const displayedComparisons = MANDATORY_KEYS.map((mandatory) => {
    const existing = shipmentCase.fieldComparisons.find((f) => f.field === mandatory.key);
    if (existing) return existing;
    return {
      field: mandatory.key,
      label: mandatory.label,
      status: "NEEDS_REVIEW" as const,
      siEvidence: null,
      blEvidence: null,
      notes: "Field missing from document extraction"
    };
  }); 

  const mismatches = shipmentCase.fieldComparisons.filter((f) => f.status === "MISMATCH");
  const normalizedMatches = shipmentCase.fieldComparisons.filter((f) => f.status === "NORMALIZED_MATCH");
  const exactMatches = shipmentCase.fieldComparisons.filter((f) => f.status === "EXACT_MATCH");
  const reviewFields = shipmentCase.fieldComparisons.filter((f) => f.status === "NEEDS_REVIEW");

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(`Subject: ${draftSubject}\n\n${draftBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApproveDraft = () => {
    setDraftApproved(true);
    if (shipmentCase.draftResolution) {
      shipmentCase.draftResolution.status = "APPROVED";
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "EXACT_MATCH":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border-2 border-emerald-600 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>EXACT MATCH</span>
          </span>
        );
      case "NORMALIZED_MATCH":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border-2 border-blue-600 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>NORMALIZED</span>
          </span>
        );
      case "MISMATCH":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-950 border-2 border-rose-600 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span className="underline decoration-rose-500">MISMATCH</span>
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-950 border-2 border-amber-600 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>NEEDS REVIEW</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="verification-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Shipment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {shipmentCase.shipmentReference}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                BL V{shipmentCase.blVersion}
              </span>
              {mismatches.length > 0 ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  {mismatches.length} Discrepanc{mismatches.length > 1 ? "ies" : "y"} Detected
                </span>
              ) : reviewFields.length > 0 ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  Needs Human Review
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  No Mismatch Detected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {shipmentCase.emailSubject} • Ingested via {shipmentCase.emailId}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenVisionOcr && (
            <button
              onClick={onOpenVisionOcr}
              className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>AI Vision OCR</span>
            </button>
          )}

          <button
            onClick={() => onAskCopilot(shipmentCase)}
            className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Ask ShipSure</span>
          </button>

          {mismatches.length > 0 && (
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Generate Correction Request</span>
            </button>
          )}

          {shipmentCase.verificationStatus === "NEEDS_REVIEW" && (
            <button
              onClick={() => onSendToHumanReview(shipmentCase.id)}
              className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-2 rounded-lg transition shadow-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Open Human Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Hard-to-Read Scan Vision Alert */}
      {(shipmentCase.reviewReason === "unreadable" ||
        shipmentCase.fieldComparisons.some(
          (f) =>
            f.blEvidence?.originalValue?.includes("smudge") ||
            f.blEvidence?.originalValue?.includes("SMUDGE")
        )) && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-4 rounded-xl shadow-md border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Hard-to-Read Scan / Messy PDF Detected</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 px-2 py-0.5 rounded font-mono font-bold">
                  Gemini 3.8 Flash Vision Model
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Text is contained in a crooked scan, dense table, or contains optical character smudges (e.g. gross weight 6#,000). Pass the scan to the AI Vision model to de-skew the image, extract tables, and disambiguate characters.
              </p>
            </div>
          </div>

          {onOpenVisionOcr && (
            <button
              onClick={onOpenVisionOcr}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AI Vision OCR Reader</span>
            </button>
          )}
        </div>
      )}

      {mismatches.length === 0 && reviewFields.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">No Mismatch Detected</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                All 7 required fields match between the customer Shipping Instruction (SI) and draft Bill of Lading (BL).
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
            7/7 Verified
          </span>
        </div>
      )}

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">SI Reference Status</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">Source of Truth (Intended)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Draft Document</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">Carrier Draft Bill of Lading</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Deterministic Checks</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {exactMatches.length} Exact • {normalizedMatches.length} Normalized
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Operational Risk Score</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {shipmentCase.priorityScore} / 100
          </div>
        </div>
      </div>

      {/* Main Side-by-Side Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              7 Mandatory Shipment Fields Comparison
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              The SI is the intended reference. The draft BL is verified prior to final issue.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-600 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Match
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Normalized
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Mismatch
            </span>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/40">
              <th className="py-3 px-4 w-44">Shipment Field</th>
              <th className="py-3 px-4 w-1/3">
                <span className="text-blue-700 font-bold">Shipping Instruction (SI)</span>
                <span className="block text-[10px] text-slate-400 font-normal">Intended details (Reference)</span>
              </th>
              <th className="py-3 px-4 w-1/3">
                <span className="text-slate-800 font-bold">Draft Bill of Lading (BL)</span>
                <span className="block text-[10px] text-slate-400 font-normal">Carrier issued candidate</span>
              </th>
              <th className="py-3 px-4">Result</th>
              <th className="py-3 px-4 text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedComparisons.map((item) => {
              const isMismatch = item.status === "MISMATCH";
              const isNormalized = item.status === "NORMALIZED_MATCH";
              const isReview = item.status === "NEEDS_REVIEW";

              return (
                <tr
                  key={item.field}
                  className={`hover:bg-slate-50 transition border-b border-slate-100 ${
                    isMismatch 
                      ? "bg-red-50/30 border-l-4 border-l-red-600" 
                      : isReview 
                      ? "bg-amber-50/30 border-l-4 border-l-amber-500" 
                      : "border-l-4 border-l-emerald-500"
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                    {item.label}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 align-top">
                    {item.siEvidence ? (
                      <div>
                        <div className="font-mono text-xs">{item.siEvidence.originalValue}</div>
                        {item.siEvidence.normalizedValue !== item.siEvidence.originalValue && (
                          <div className="text-[11px] text-blue-600 font-mono mt-0.5">
                            Norm: {String(item.siEvidence.normalizedValue)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not found on SI</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 align-top">
                    {item.blEvidence ? (
                      <div>
                        <div className={`font-mono text-xs ${isMismatch ? "text-red-700 font-bold" : ""}`}>
                          {item.blEvidence.originalValue}
                        </div>
                        {item.blEvidence.normalizedValue !== item.blEvidence.originalValue && (
                          <div className="text-[11px] text-blue-600 font-mono mt-0.5">
                            Norm: {String(item.blEvidence.normalizedValue)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not found on Draft BL</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    {getStatusPill(item.status)}
                    {item.notes && (
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right align-top">
                    <button
                      onClick={() => setActiveEvidence(item)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium underline flex items-center justify-end gap-1 ml-auto"
                    >
                      <span>Evidence</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===================================================== */}
      {/* VERSION INTELLIGENCE — FUTURE EXTENSION */}
      {/* ===================================================== */}

      {shipmentCase.category ===
        "BL_COMPARISON" && (
        <>
          {shipmentCase.hasRevision &&
          shipmentCase.revisionComparison ? (
            <RevisionPanel
              shipmentCase={
                shipmentCase
              }
              onNavigateToHumanReview={
                onSendToHumanReview
              }
            />
          ) : (
            <div className="bg-indigo-50/40 border border-dashed border-indigo-200 rounded-xl px-4 py-3">

              <div className="flex items-center gap-2">

                <GitCompare className="w-4 h-4 text-indigo-600" />

                <span className="text-xs font-bold text-slate-900">
                  Version Intelligence
                </span>

                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                  FUTURE EXTENSION
                </span>

              </div>

              <p className="text-[11px] text-slate-500 mt-1.5">

                No revised BL is linked to this shipment.
                ShipSure is designed to support future
                SI ↔ BL V1 ↔ BL V2 re-verification when
                a revised document becomes available.

              </p>

            </div>
          )}
        </>
      )}

      {/* Evidence Drawer / Modal */}
      {activeEvidence && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Evidence for {activeEvidence.label}</span>
              </div>
              <button
                onClick={() => setActiveEvidence(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* SI Evidence Card */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
                <div className="font-bold text-blue-900 mb-1 flex items-center justify-between">
                  <span>Shipping Instruction (SI) Reference</span>
                  <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                    Confidence: {activeEvidence.siEvidence?.confidence || "HIGH"}
                  </span>
                </div>
                <div className="text-slate-700">
                  <strong>Original Text:</strong> {activeEvidence.siEvidence?.originalValue}
                </div>
                <div className="text-slate-700 mt-1">
                  <strong>Normalized Form:</strong> {String(activeEvidence.siEvidence?.normalizedValue)}
                </div>
                {activeEvidence.siEvidence?.snippet && (
                  <div className="mt-2 text-[11px] bg-white p-2 rounded border border-blue-100 font-mono text-slate-600">
                    "{activeEvidence.siEvidence.snippet}"
                  </div>
                )}
              </div>

              {/* BL Evidence Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>Draft Bill of Lading (BL)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                    Confidence: {activeEvidence.blEvidence?.confidence || "HIGH"}
                  </span>
                </div>
                <div className="text-slate-700">
                  <strong>Original Text:</strong> {activeEvidence.blEvidence?.originalValue}
                </div>
                <div className="text-slate-700 mt-1">
                  <strong>Normalized Form:</strong> {String(activeEvidence.blEvidence?.normalizedValue)}
                </div>
                {activeEvidence.blEvidence?.snippet && (
                  <div className="mt-2 text-[11px] bg-white p-2 rounded border border-slate-200 font-mono text-slate-600">
                    "{activeEvidence.blEvidence.snippet}"
                  </div>
                )}
              </div>

              {activeEvidence.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                  <strong>Decision Engine Notes:</strong> {activeEvidence.notes}
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveEvidence(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution & Draft Amendment Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Draft Carrier Amendment Request
                </h3>
                <p className="text-xs text-slate-500">
                  Human-in-the-Loop approval required. Messages are never dispatched externally without confirmation.
                </p>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amendment Email Body</label>
                <textarea
                  rows={8}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={handleCopyDraft}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Email Draft"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApproveDraft}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    draftApproved
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{draftApproved ? "Draft Approved for Sending" : "Approve Draft"}</span>
                </button>
                <button
                  onClick={() => setShowCorrectionModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};