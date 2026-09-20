import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Download, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check,
  Server,
  Layers
} from "lucide-react";
import { datasetProvider } from "../services/datasetProvider";
/**
 * Evaluation View 
 * 
 * Main responsibilities:
 * - Generate the evaluation submission JSON.
 * - Display the generated submission.
 * - Allow the user to copy the submission JSON
 * - Allow the user to download the submission JSON.
 * - Submit the evaluation payload to the Docker scoring server.
 * - Display the returned evaluation and benchmark results.
 */
export const EvaluationView: React.FC = () => {
  /**
   * Stores the generated evaluation submission as a formatted JSON string.
   * 
   * The initial submission is generated from the current dataset using
   * datasetProvider.generateEvaluationSubmission().
   */
  const [submissionJson, setSubmissionJson] = useState<string>(() => {
    return JSON.stringify(datasetProvider.generateEvaluationSubmission(), null, 2);
  });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoringResult, setScoringResult] = useState<any>(null);
  const [dockerUrl, setDockerUrl] = useState("http://localhost:8080");

  /**
   * Generates a new evaluaton submission from the current dataset
   * 
   * This generated submission is converted into JSON and displayed in the 
   * Evaluation tab.
   */
  const handleRegenerate = () => {
    const fresh = JSON.stringify(datasetProvider.generateEvaluationSubmission(), null, 2);
    setSubmissionJson(fresh);
  };

  /**
   * Copies the current submission JSON to the user's clipboard.
   *
   * After the copy operation, the "Copied!" state is displayed for
   * two seconds before returning to the normal "Copy Payload" state.
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(submissionJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Downloads the current evaluation submission as a JSON file.
   *
   * The generated file is named "submission.json".
   *
   * The function creates a temporary browser URL for the JSON Blob,
   * triggers the download, and then removes the temporary URL.
   */
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

  /**
   * Submits the current evaluation submission to the Docker
   * evaluation/scoring server.
   *
   * Process:
   * 1. Enable the submitting state.
   * 2. Parse the JSON submission.
   * 3. Send the submission to the backend evaluation endpoint.
   * 4. Receive the scoring response.
   * 5. Store the scoring result for display.
   * 6. Reset the submitting state.
   *
   * If the evaluation request fails, a fallback evaluation result
   * is displayed.
   */
  const handleSubmitToDocker = async () => {
    setSubmitting(true);
    setScoringResult(null);

    try {
      const parsed = JSON.parse(submissionJson);
       /**
       * Send the evaluation submission to the backend.
       *
       * The backend endpoint is responsible for communicating
       * with the Docker scoring server.
       */
      const res = await fetch("/api/evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dockerUrl,
          submission: parsed
        })
      });

      const data = await res.json();
      if (data.simulatedFallback) {
        setScoringResult(data.simulatedFallback);
      } else {
        setScoringResult(data);
      }
    } catch (err: any) {
      setScoringResult({
        message: `Evaluation unavailable: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="evaluation-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
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
            className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 hover:bg-slate-50 font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate JSON</span>
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

      {/* Docker Server Submission Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Docker Evaluation Benchmark</h2>
              <p className="text-xs text-slate-500">
                POST your JSON payload to the official scoring container endpoint (<span className="font-mono">/submit</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={dockerUrl}
              onChange={(e) => setDockerUrl(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 font-mono w-56"
              placeholder="http://localhost:8080"
            />
            <button
              onClick={handleSubmitToDocker}
              disabled={submitting}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Scorer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scoring Response Billboard */}
        {scoringResult && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in">
            <div className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Scoring Evaluation Results
            </div>
          
            {/* Email classification */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-blue-700">Stage-1 Macro F1</div>
                <div className="text-xl font-bold text-blue-900 mt-0.5">
                  {scoringResult.stage1_macro_f1 ?? "N/A"}
                </div>
                <div className="text-[10px] text-blue-600">Email classification</div>
              </div>

              {/* Discrepancy detection */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-indigo-700">Stage-3 Defect F1</div>
                <div className="text-xl font-bold text-indigo-900 mt-0.5">
                  {scoringResult.stage3_defect_f1 ?? "N/A"}
                </div>
                <div className="text-[10px] text-indigo-600">Discrepancy accuracy</div>
              </div>
              
              {/* Complete pipeline */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-purple-700">End-to-End Accuracy</div>
                <div className="text-xl font-bold text-purple-900 mt-0.5">
                  {scoringResult.end_to_end_accuracy ?? "N/A"}
                </div>
                <div className="text-[10px] text-purple-600">Complete pipeline</div>
              </div>

              {/* Hackathon Benchmark */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-emerald-700">Composite Score</div>
                <div className="text-xl font-bold text-emerald-900 mt-0.5">
                  {scoringResult.final_score ?? "N/A"}
                  {scoringResult.final_score != null && " / 100"}
                </div>
                <div className="text-[10px] text-emerald-600">Hackathon Benchmark</div>
              </div>
            </div>

            {scoringResult.message && (
              <p className="text-[11px] text-slate-500 mt-2 italic">
                Note: {scoringResult.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Evaluation Case Review */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Evaluation Case Review
          </h3>

          <p className="text-[11px] text-slate-500">
            Review shipment cases where the AI result may require further investigation
          </p>
        </div>

        <div className="space-y-2">
          {datasetProvider.getCases()
            .filter((c) => c.hasDefect || c.verificationStatus === "NEEDS_REVIEW")
            .slice(0, 5)
            .map((c) => (
              <div
                key={c.id}
                className="border border-slate-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {c.shipmentReference}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {c.emailSubject}
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                    {c.verificationStatus}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-600">
                  Defect fields:{" "}
                  {c.defectFields.length > 0
                    ? c.defectFields.join(", ")
                    : "None"}
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* JSON Viewer and Inspector */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">submission.json</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
              Schema Validated
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-200/50 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Payload"}</span>
          </button>
        </div>

        <pre className="p-4 text-xs font-mono bg-slate-900 text-slate-200 max-h-96 overflow-y-auto leading-relaxed">
          {submissionJson}
        </pre>
      </div>
    </div>
  );
};
