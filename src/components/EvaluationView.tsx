import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Send,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Server
} from "lucide-react";
import { datasetProvider } from "../services/datasetProvider";

/**
 * Evaluation View 
 */
export const EvaluationView: React.FC = () => {
  const [submissionJson, setSubmissionJson] = useState<string>(() => {
    return JSON.stringify(datasetProvider.generateEvaluationSubmission(), null, 2);
  });
  const [copied, setCopied] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoringResult, setScoringResult] = useState<any>(null);
  const [dockerUrl, setDockerUrl] = useState("http://localhost:8080");

  // Auto-sync on view open
  useEffect(() => {
    setSubmissionJson(JSON.stringify(datasetProvider.generateEvaluationSubmission(), null, 2));
  }, []);

  const handleRegenerate = () => {
    const fresh = JSON.stringify(datasetProvider.generateEvaluationSubmission(), null, 2);
    setSubmissionJson(fresh);
    setRegenerated(true);
    setTimeout(() => setRegenerated(false), 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(submissionJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([submissionJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submission.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitToDocker = async () => {
    setSubmitting(true);
    setScoringResult(null);
    try {
      const parsed = JSON.parse(submissionJson);
      const res = await fetch("/api/evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dockerUrl, submission: parsed })
      });
      const data = await res.json();
      setScoringResult(data.simulatedFallback || data);
    } catch (err: any) {
      setScoringResult({ message: `Evaluation unavailable: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="evaluation-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            AI Reliability & Evaluation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate AI extraction, verification, confidence, and human-review performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer border ${
              regenerated
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {regenerated ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in" />
                <span>JSON Refreshed!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Regenerate JSON</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download submission.json</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        {/* ... (Docker Submission Logic Remains Same) ... */}
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200"><Server className="w-5 h-5" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Docker Evaluation Benchmark</h2>
              <p className="text-xs text-slate-500">POST payload to <span className="font-mono">/submit</span></p>
            </div>
        </div>
        
        {scoringResult && (
           <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in">
             {/* ... (Scoring Results Grid) ... */}
             <div className="text-xs font-bold text-slate-900 mb-3">Scoring Evaluation Results</div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                 <div className="text-[11px] font-semibold text-blue-700">Stage-1 Macro F1</div>
                 <div className="text-xl font-bold text-blue-900 mt-0.5">{scoringResult.stage1_macro_f1 ?? "N/A"}</div>
               </div>
               <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                 <div className="text-[11px] font-semibold text-indigo-700">Stage-3 Defect F1</div>
                 <div className="text-xl font-bold text-indigo-900 mt-0.5">{scoringResult.stage3_defect_f1 ?? "N/A"}</div>
               </div>
               <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                 <div className="text-[11px] font-semibold text-purple-700">End-to-End Accuracy</div>
                 <div className="text-xl font-bold text-purple-900 mt-0.5">{scoringResult.end_to_end_accuracy ?? "N/A"}</div>
               </div>
               <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                 <div className="text-[11px] font-semibold text-emerald-700">Composite Score</div>
                 <div className="text-xl font-bold text-emerald-900 mt-0.5">{scoringResult.final_score ?? "N/A"}</div>
               </div>
             </div>
           </div>
        )}
      </div>

      {/* Evaluation Case Review Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Evaluation Case Review</h3>
        <div className="space-y-2">
          {datasetProvider.getCases()
            .filter((c) => c.hasDefect || c.verificationStatus === "NEEDS_REVIEW")
            .slice(0, 5)
            .map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-900">{c.shipmentReference}</div>
                  <div className="text-[11px] text-slate-500">{c.emailSubject}</div>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">{c.verificationStatus}</span>
              </div>
            ))}
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">submission.json</span>
          <button onClick={handleCopy} className="text-xs font-semibold px-2 py-1 hover:bg-slate-200 rounded">
            {copied ? "Copied!" : "Copy Payload"}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono bg-slate-950 text-emerald-300 max-h-96 overflow-y-auto border-t border-slate-800">
          {submissionJson}
        </pre>
      </div>
    </div>
  );
};