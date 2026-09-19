/**
 * ShipSure AI - AI Vision Model & OCR Document Reader
 * Specialized for hard-to-read scans, crooked images, dense container tables,
 * and optical character smudge disambiguation using Multimodal Gemini Vision.
 */

import React, { useState } from "react";
import {
  Camera,
  FileScan,
  RotateCw,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Table,
  FileText,
  Upload,
  X,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Check,
  ArrowRight,
  ShieldCheck,
  Eye,
  Layers,
  Copy
} from "lucide-react";
import { ComparisonField, ShipmentCase } from "../types";

interface VisionOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase?: ShipmentCase;
  onApplyExtractedFields?: (fields: Record<string, any>) => void;
  onSendToReviewWithCandidates?: (caseId: string, candidates: any) => void;
}

interface ScanPreset {
  id: string;
  name: string;
  badge: string;
  type: "crooked_scan" | "messy_table" | "mobile_photo" | "smudged_thermal";
  description: string;
  rotationDeg: number;
  contrastMode: boolean;
  sampleText: string;
  defectNote: string;
}

const SCAN_PRESETS: ScanPreset[] = [
  {
    id: "preset-msc-crooked",
    name: "Crooked MSC B/L Scan (-7.4°)",
    badge: "Optical Smudge + Skew",
    type: "crooked_scan",
    description: "Scanned at -7.4° angle on flatbed scanner. Digit 2 of Gross Weight has grease smudge.",
    rotationDeg: -7.4,
    contrastMode: false,
    sampleText: `BILL OF LADING\nB/L: MSCU881029\nShipper: HYUNDAI HEAVY INDUSTRIES CO LTD\nConsignee: ROTTERDAM OFFSHORE ENERGY BV\nNotify Party: ROTTERDAM OFFSHORE ENERGY BV\nLoad Port: BUSAN\nDischarge Port: ROTTERDAM\nContainer Count: 5\nGross Weight: 6#,000 KG [SMUDGED: 64,000 OR 68,000]`,
    defectNote: "Character ambiguity detected: 64,000 KG vs 68,000 KG"
  },
  {
    id: "preset-one-table",
    name: "Messy Multi-Container Table B/L",
    badge: "Dense Tabular Grid",
    type: "messy_table",
    description: "Dense 5-row container breakdown table with misaligned columns and dot-matrix lines.",
    rotationDeg: 2.1,
    contrastMode: true,
    sampleText: `OCEAN NETWORK EXPRESS DRAFT B/L\nShipper: NINGBO TEXTILES IMP & EXP CO\nConsignee: RETAIL MAJORS CORP UK\nNotify: RETAIL MAJORS CORP UK\nPOL: NINGBO\nPOD: SOUTHAMPTON\nCONTAINER MANIFEST TABLE:\n[CNTR]       [SEAL]      [SIZE]  [GROSS WT]\nONEY1029812  SEAL-9912   40HC    14,200 KG\nONEY1029813  SEAL-9913   40HC    14,200 KG\nONEY1029814  SEAL-9914   40HC    14,200 KG\nTOTAL COUNT: 3 CONTAINERS | TOTAL WT: 42,600 KG`,
    defectNote: "Table columns automatically rectified & aggregated"
  },
  {
    id: "preset-phone-photo",
    name: "Warehouse Floor Phone Photo",
    badge: "Perspective Distortion",
    type: "mobile_photo",
    description: "Photograph taken with phone camera under fluorescent light with keystone distortion.",
    rotationDeg: 12.5,
    contrastMode: false,
    sampleText: `EVERGREEN MARINE CORP\nBILL OF LADING DRAFT\nShipper: EVERGREEN CHEMICAL CORP\nConsignee: DOW INTERNATIONAL LOGISTICS\nPOL: KAOHSIUNG\nPOD: ROTTERDAM\nCONTAINERS: 2 x 20' GP\nGROSS WEIGHT: 32,150 KGS`,
    defectNote: "Keystone corrected, normalized to 32,150 KG"
  }
];

export const VisionOcrModal: React.FC<VisionOcrModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  onApplyExtractedFields,
  onSendToReviewWithCandidates
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ScanPreset>(SCAN_PRESETS[0]);
  const [rotation, setRotation] = useState<number>(SCAN_PRESETS[0].rotationDeg);
  const [zoom, setZoom] = useState<number>(1);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"fields" | "table" | "raw" | "ambiguity">("fields");
  const [loading, setLoading] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [customFile, setCustomFile] = useState<{ name: string; base64?: string } | null>(null);

  // Vision OCR Result state
  const [ocrResult, setOcrResult] = useState<any>({
    source: "Gemini 3.8 Flash Multimodal Vision Model",
    orientationCorrection: "Auto-deskewed +7.4° counter-clockwise",
    qualityScore: 0.94,
    fields: {
      shipper: { value: "HYUNDAI HEAVY INDUSTRIES CO LTD", confidence: 0.98, rawSnippet: "Shipper: HYUNDAI HEAVY INDUSTRIES CO LTD" },
      consignee: { value: "ROTTERDAM OFFSHORE ENERGY BV", confidence: 0.99, rawSnippet: "Consignee: ROTTERDAM OFFSHORE ENERGY BV" },
      notify_party: { value: "ROTTERDAM OFFSHORE ENERGY BV", confidence: 0.98, rawSnippet: "Notify Party: ROTTERDAM OFFSHORE ENERGY BV" },
      port_of_loading: { value: "BUSAN", confidence: 0.95, rawSnippet: "Load Port: BUSAN [KRPUS]" },
      port_of_discharge: { value: "ROTTERDAM", confidence: 0.96, rawSnippet: "Discharge Port: ROTTERDAM [NLRTM]" },
      container_count: { value: 5, confidence: 0.97, rawSnippet: "Container Count: 5 Units" },
      gross_weight_kg: {
        value: 64000,
        confidence: 0.62,
        rawSnippet: "Gross Weight: 6#,000 KG",
        opticalWarning: "Smudged digit on scan (Character ambiguity between '4' and '8')"
      }
    },
    tablesExtracted: [
      {
        headers: ["Container No", "Seal No", "Type", "Tare Wt", "Cargo Gross Wt"],
        rows: [
          ["HMCU9018291", "KR-990182", "40HC", "3,820 KG", "12,800 KG"],
          ["HMCU9018292", "KR-990183", "40HC", "3,820 KG", "12,800 KG"],
          ["HMCU9018293", "KR-990184", "40HC", "3,820 KG", "12,800 KG"],
          ["HMCU9018294", "KR-990185", "40HC", "3,820 KG", "12,800 KG"],
          ["HMCU9018295", "KR-990186", "40HC", "3,820 KG", "12,800 KG"]
        ]
      }
    ],
    opticalAmbiguities: [
      {
        field: "gross_weight_kg",
        candidates: ["64,000 KG (Confidence: 62%)", "68,000 KG (Confidence: 38%)"],
        recommendation: "Zero-Guess Critic Policy: Do not guess silently. Human Optical Verification Required."
      }
    ]
  });

  if (!isOpen) return null;

  // Handle Preset Switching
  const handleSelectPreset = (preset: ScanPreset) => {
    setSelectedPreset(preset);
    setRotation(preset.rotationDeg);
    setHighContrast(preset.contrastMode);
    setCustomFile(null);
    triggerVisionScan(preset.sampleText, preset.name);
  };

  // Trigger Vision OCR Scan via Backend API
  const triggerVisionScan = async (sampleText?: string, filename?: string) => {
    setLoading(true);
    setApplied(false);
    try {
      const res = await fetch("/api/vision/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawTextSample: sampleText || selectedPreset.sampleText,
          filename: filename || customFile?.name || selectedPreset.name,
          imageBase64: customFile?.base64,
          docType: "Bill of Lading"
        })
      });

      const json = await res.json();
      if (json.data) {
        setOcrResult(json.data);
      }
    } catch (err) {
      console.error("Vision OCR Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomFile({ name: file.name, base64 });
      triggerVisionScan(undefined, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(ocrResult.rawOcrText || selectedPreset.sampleText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleApplyToCase = () => {
    if (onApplyExtractedFields && ocrResult?.fields) {
      onApplyExtractedFields(ocrResult.fields);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div
      id="vision-ocr-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Multimodal AI Vision & OCR Document Reader
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Gemini 3.8 Flash Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                De-skews crooked scans, parses container tables, and isolates character smudges with zero-guess confidence scores.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector Banner */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Hard-to-Read Scenarios:
            </span>
            {SCAN_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id && !customFile;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 cursor-pointer border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Upload Custom Messy PDF or Image */}
          <label className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1 rounded-lg font-semibold text-[11px] cursor-pointer transition shrink-0">
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>{customFile ? customFile.name : "Upload Messy Scan / PDF"}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Main Work Area: Left = Optical Canvas Viewer, Right = Extracted Structured Data */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Optical Scan & Computer Vision Stage */}
          <div className="w-full md:w-1/2 bg-slate-900 border-r border-slate-800 flex flex-col p-4 relative overflow-hidden">
            {/* Stage Controls Toolbar */}
            <div className="flex items-center justify-between bg-slate-800/90 backdrop-blur-xs p-2 rounded-xl border border-slate-700 text-xs text-slate-300 mb-3 shrink-0 z-10">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRotation((r) => r - 5)}
                  title="Rotate Left -5°"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => r + 5)}
                  title="Rotate Right +5°"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation(0)}
                  className="px-2 py-1 text-[10px] font-bold bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition cursor-pointer"
                >
                  Reset ({rotation.toFixed(1)}°)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                    highContrast
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>Threshold Filter</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Optical Document Scan Canvas */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800 relative">
              <div
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: "transform 0.2s ease-out"
                }}
                className={`w-[360px] min-h-[460px] bg-amber-50/95 text-slate-900 p-6 rounded shadow-2xl font-mono text-[11px] leading-relaxed border border-amber-200 select-none relative ${
                  highContrast ? "contrast-200 grayscale invert" : ""
                }`}
              >
                {/* Paper watermarks & alignment markers */}
                <div className="absolute top-2 left-2 text-[8px] text-slate-400 tracking-widest uppercase">
                  + SCAN_CALIBRATION_GRID_A1 +
                </div>
                <div className="absolute top-2 right-2 text-[8px] text-slate-400 tracking-widest uppercase">
                  + RECT_ALIGN +
                </div>

                <div className="border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="font-bold text-xs tracking-wider">
                    {selectedPreset.name.toUpperCase()}
                  </div>
                  <div className="text-[9px] text-slate-600">
                    STATUS: HARD-TO-READ SCAN // RESOLUTION: 150 DPI
                  </div>
                </div>

                {/* Body of document with simulated optical imperfections */}
                <div className="whitespace-pre-line text-slate-800">
                  {selectedPreset.sampleText}
                </div>

                {/* Visual optical smudge callout badge if present */}
                {selectedPreset.type === "crooked_scan" && (
                  <div className="mt-4 p-2 bg-red-100/90 border border-red-300 text-red-900 rounded text-[10px] flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Optical Smudge on Gross Weight: 6#,000 (Candidate A: 64k vs B: 68k)</span>
                  </div>
                )}

                {/* Table representation if messy table */}
                {selectedPreset.type === "messy_table" && (
                  <div className="mt-3 p-2 bg-blue-50/90 border border-blue-200 text-blue-900 rounded text-[10px]">
                    <div className="font-bold">Multi-Container Manifest Table</div>
                    <div className="text-[9px] text-blue-700">3 Container Units Aggregated into Single Case</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom status badge */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>{ocrResult.orientationCorrection}</span>
              </span>
              <button
                onClick={() => triggerVisionScan()}
                disabled={loading}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Reading Scan..." : "Re-Scan with Vision Model"}</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Extracted Structured Data & Ambiguity Inspector */}
          <div className="w-full md:w-1/2 flex flex-col bg-white">
            {/* Tab Navigation */}
            <div className="border-b border-slate-200 px-4 pt-2 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("fields")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "fields"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Extracted 7 Fields</span>
                </button>

                <button
                  onClick={() => setActiveTab("table")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "table"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Container Table</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded">5</span>
                </button>

                <button
                  onClick={() => setActiveTab("ambiguity")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "ambiguity"
                      ? "border-amber-600 text-amber-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ambiguity Gate</span>
                  {ocrResult.opticalAmbiguities?.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1 rounded">!</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("raw")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "raw"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileScan className="w-3.5 h-3.5" />
                  <span>Raw OCR</span>
                </button>
              </div>

              <div className="text-[10px] font-bold text-slate-500">
                Score: <span className="text-emerald-700">94.8%</span>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {/* 1. EXTRACTED 7 FIELDS VIEW */}
              {activeTab === "fields" && (
                <div className="space-y-2.5">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Multimodal Vision Extraction Completed:</span> De-skewed crooked image, rectified text lines, and normalized weights into standard KG metrics.
                    </div>
                  </div>

                  {ocrResult.fields &&
                    Object.entries(ocrResult.fields).map(([key, fieldData]: [string, any]) => {
                      const label = key
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ");
                      const isWarn = Boolean(fieldData.opticalWarning);

                      return (
                        <div
                          key={key}
                          className={`bg-white rounded-xl p-3 border transition ${
                            isWarn ? "border-amber-300 bg-amber-50/40" : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-700">{label}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                fieldData.confidence > 0.9
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {(fieldData.confidence * 100).toFixed(0)}% Confidence
                            </span>
                          </div>

                          <div className="text-sm font-semibold text-slate-900">
                            {String(fieldData.value)}
                          </div>

                          {fieldData.rawSnippet && (
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              Snippet: "{fieldData.rawSnippet}"
                            </div>
                          )}

                          {fieldData.opticalWarning && (
                            <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-100/80 px-2 py-1 rounded font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{fieldData.opticalWarning}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* 2. TABLE PARSER VIEW */}
              {activeTab === "table" && (
                <div className="space-y-3">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Container Matrix Structure:</span> The vision model detected tabular boundaries and converted rows into structured records.
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                          {ocrResult.tablesExtracted?.[0]?.headers.map((h: string, i: number) => (
                            <th key={i} className="p-2.5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {ocrResult.tablesExtracted?.[0]?.rows.map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="p-2.5 text-slate-800">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. OPTICAL AMBIGUITY / ZERO-GUESS GATE VIEW */}
              {activeTab === "ambiguity" && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Zero-Guess Reliability Enforcement</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      SDOC rules mandate that when an optical character cannot be read with 100% certainty (e.g. smudged scan or folded paper), the AI must NOT invent or guess values. It must flag dual candidates and mandate human review.
                    </p>
                  </div>

                  {ocrResult.opticalAmbiguities?.map((amb: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                    >
                      <div className="text-xs font-bold text-slate-800">
                        Ambiguous Field: <span className="text-red-700 font-mono">{amb.field}</span>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 mb-1">
                          Vision Model Dual Candidates:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {amb.candidates.map((cand: string, cIdx: number) => (
                            <div
                              key={cIdx}
                              className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-mono text-slate-800 text-center font-bold"
                            >
                              {cand}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] bg-slate-100 p-2.5 rounded-lg text-slate-700 font-medium">
                        <strong>Policy Action:</strong> {amb.recommendation}
                      </div>

                      {onSendToReviewWithCandidates && activeCase && (
                        <button
                          onClick={() => {
                            onSendToReviewWithCandidates(activeCase.id, amb.candidates);
                            onClose();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Escalate to Human Review Queue with Dual Candidates</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 4. RAW OCR TEXT VIEW */}
              {activeTab === "raw" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Verbatim OCR Stream</span>
                    <button
                      onClick={handleCopyRaw}
                      className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:underline"
                    >
                      {copiedRaw ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedRaw ? "Copied" : "Copy Raw OCR"}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {ocrResult.rawOcrText || selectedPreset.sampleText}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                Target: <span className="font-semibold text-slate-800">{activeCase?.shipmentReference || "Active Case"}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleApplyToCase}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {applied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{applied ? "Applied to Case Evidence!" : "Apply OCR to Case"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
