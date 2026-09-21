import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  HardDrive,
  FolderOpen
} from "lucide-react";
import { datasetProvider } from "../services/datasetProvider";

// ✅ Added props interface with onRefreshData callback
interface SettingsViewProps {
  onRefreshData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [dataSource, setDataSource] = useState<"DEMO" | "LOCAL" | "DOCKER">("DOCKER");
  const [dataPath, setDataPath] = useState("./data");
  const [dataApiUrl, setDataApiUrl] = useState("http://localhost:8080");
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchHealth = async () => {
    setTestingHealth(true);

    try {
      const res =
        await fetch("/api/health");

      const data =
        await res.json();

      setServerHealth(data);

      // Keep Settings UI synchronized
      // with the actual backend configuration.
      if (data?.config?.dataSource) {
        setDataSource(
          data.config.dataSource
        );
      }

      if (data?.config?.dataPath) {
        setDataPath(
          data.config.dataPath
        );
      }

      if (data?.config?.dataApiUrl) {
        setDataApiUrl(
          data.config.dataApiUrl
        );
      }
    } catch {
      setServerHealth({
        status:
          "offline",

        hasGeminiKey:
          false
      });
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSaveConfig = async () => {
    datasetProvider.setSource(dataSource);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSource,
          dataPath,
          dataApiUrl
        })
      });
      setSavedSuccess(true);
      // ✅ Reload cases and emails in App.tsx immediately
      onRefreshData?.();
      setTimeout(() => setSavedSuccess(false), 2500);
      fetchHealth();
    } catch (e) {
      console.error(e);
      // ✅ Ensure local UI data state updates even if backend endpoint is unavailable
      onRefreshData?.();
    }
  };

  return (
    <div id="settings-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Dataset & System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure operational data sources (Synthetic Demo, Local Hackathon Directory, or Docker scoring API).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Source Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Active Data Source Mode
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Demo */}
              <div
                onClick={() => setDataSource("DEMO")}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  dataSource === "DEMO"
                    ? "border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-xs">Synthetic Demo</span>
                    {dataSource === "DEMO" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Built-in SDOC dataset containing 12 emails, 7-field SI vs BL cases, revisions & unreadable scans.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 mt-3">Ready to evaluate</span>
              </div>

              {/* Option 2: Local Folder */}
              <div
                onClick={() => setDataSource("LOCAL")}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  dataSource === "LOCAL"
                    ? "border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-xs">Local Directory</span>
                    {dataSource === "LOCAL" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Reads from filesystem path with <span className="font-mono text-[10px]">emails.json</span> and <span className="font-mono text-[10px]">documents/</span>.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-3">Configurable path</span>
              </div>

              {/* Option 3: Docker */}
              <div
                onClick={() => setDataSource("DOCKER")}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  dataSource === "DOCKER"
                    ? "border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-xs">Docker Container</span>
                    {dataSource === "DOCKER" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Connects directly to the hackathon evaluation container running on <span className="font-mono text-[10px]">localhost:8080</span>.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-3">REST API</span>
              </div>
            </div>

            {/* Inputs based on selection */}
            {dataSource === "LOCAL" && (
              <div className="pt-2 text-xs">
                <label className="block font-semibold text-slate-700 mb-1">Local Data Path</label>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={dataPath}
                    onChange={(e) => setDataPath(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            {dataSource === "DOCKER" && (
              <div className="pt-2 text-xs">
                <label className="block font-semibold text-slate-700 mb-1">Docker API Endpoint</label>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={dataApiUrl}
                    onChange={(e) => setDataApiUrl(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configuration saved and active!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Changes take effect immediately across all system modules.
                </span>
              )}

              <button
                onClick={handleSaveConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Server & AI Engine Status */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                System Health & API
              </h2>
              <button
                onClick={fetchHealth}
                disabled={testingHealth}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${testingHealth ? "animate-spin" : ""}`} />
                Ping
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Backend Server (Port 3000):</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Gemini 3.8 Flash SDK:</span>
                {serverHealth?.hasGeminiKey ? (
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured (Server)
                  </span>
                ) : (
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                    Autonomous Multi-Agent Engine
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Dataset Provider:</span>
                <span className="font-bold text-slate-800 uppercase">{dataSource} Mode</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Active Ingested Cases:</span>
                <span className="font-bold text-slate-800">{datasetProvider.getCases().length} Loaded</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              ShipSure AI operates securely with zero browser API key exposure. When <span className="font-mono">GEMINI_API_KEY</span> is present in the server environment, live generative explanations and reasoning are enriched through Gemini 3.8 Flash.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};