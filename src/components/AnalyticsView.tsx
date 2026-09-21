import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  Info,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ShipmentCase, ComparisonField } from "../types";

interface AnalyticsViewProps {
  cases: ShipmentCase[];
  onSelectFieldDrillDown: (field: ComparisonField) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  cases,
  onSelectFieldDrillDown
}) => {
  const [showAssumptions, setShowAssumptions] = useState(false);

  // --- 1. Overall Stats ---
  const totalCases = cases.length;
  const okCases = cases.filter((c) => c.verificationStatus === "OK").length;
  const mismatchCases = cases.filter((c) => c.verificationStatus === "MISMATCH").length;
  const reviewCases = cases.filter((c) => c.verificationStatus === "NEEDS_REVIEW").length;
  const mismatchRate = totalCases > 0 ? (mismatchCases / totalCases) * 100 : 0;

  const automaticallyVerifiedCases = cases.filter(
    (c) => c.verificationStatus === "OK" || c.verificationStatus === "MISMATCH"
  ).length;

  const automatedVerificationRate =
    totalCases > 0 ? (automaticallyVerifiedCases / totalCases) * 100 : 0;

  // --- 2. Field Frequency Calculation ---
  const fieldCounts: Record<ComparisonField, number> = {
    container_count: 0,
    gross_weight_kg: 0,
    port_of_discharge: 0,
    port_of_loading: 0,
    shipper: 0,
    consignee: 0,
    notify_party: 0
  };

  (cases ?? []).forEach((c) => {
    // Only count cases that actually have a mismatch
    if (c.verificationStatus !== "MISMATCH") return;
    // Count each field only once per case
    const uniqueFields = new Set(c.defectFields ?? []);
    uniqueFields.forEach((field) => {
      if (field in fieldCounts) {
        fieldCounts[field as ComparisonField]++;
      }
    });
  });

  const chartData = [
    { field: "Gross Weight", key: "gross_weight_kg", count: fieldCounts.gross_weight_kg },
    { field: "Container Count", key: "container_count", count: fieldCounts.container_count },
    { field: "Consignee", key: "consignee", count: fieldCounts.consignee },
    { field: "Discharge Port", key: "port_of_discharge", count: fieldCounts.port_of_discharge },
    { field: "Shipper", key: "shipper", count: fieldCounts.shipper },
    { field: "Loading Port", key: "port_of_loading", count: fieldCounts.port_of_loading },
    { field: "Notify Party", key: "notify_party", count: fieldCounts.notify_party },
  ];

  // --- 4. Comparison Status Counts ---
  const comparisonStatusCounts = {
    EXACT_MATCH: 0,
    NORMALIZED_MATCH: 0,
    MISMATCH: 0,
    NEEDS_REVIEW: 0,
  };

  cases.forEach((c) => {
    c.fieldComparisons.forEach((comparison) => {
      comparisonStatusCounts[comparison.status]++;
    });
  });

  const comparisonChartData = [
    { status: "Exact Match", count: comparisonStatusCounts.EXACT_MATCH },
    { status: "Normalized Match", count: comparisonStatusCounts.NORMALIZED_MATCH },
    { status: "Mismatch", count: comparisonStatusCounts.MISMATCH },
    { status: "Needs Review", count: comparisonStatusCounts.NEEDS_REVIEW },
  ];

  const pieData = [
    { name: "Clean (No Mismatch)", value: okCases, color: "#10b981" },
    { name: "Carrier Discrepancy", value: mismatchCases, color: "#8b5cf6" },
    { name: "Human Review", value: reviewCases, color: "#f59e0b" },
  ];

  return (
    <div id="analytics-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Operational Analytics & Discrepancy Trends
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Defensible metric intelligence, error heatmaps, and measurable ROI impact.
          </p>
        </div>
      </div>

      {/* Business Impact / ROI Cards (Your UI with correct Math) */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Quantifiable Business Impact</h2>
            <p className="text-[11px] text-slate-400">Calculated over historical verification volume</p>
          </div>
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 font-medium underline cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            {showAssumptions ? "Hide Assumptions" : "View Transparent Assumptions"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-[11px] text-blue-200 font-medium">Estimated Carrier Fine Avoidance</div>
            <div className="text-2xl font-bold text-white mt-1">${(mismatchCases * 2500).toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Prevented customs manifest penalties & vessel roll fees
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-[11px] text-blue-200 font-medium">Clerical Labor Saved</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{((cases.length * 3.5) / 60).toFixed(1)} Hours</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Reduced manual document checking from 5 min to 1.5 min per case
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-[11px] text-blue-200 font-medium">Auto-Verification Rate</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{automatedVerificationRate.toFixed(1)}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Percentage of cases processed autonomously
            </p>
          </div>
        </div>

        {showAssumptions && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-300 space-y-1 bg-white/5 p-3 rounded-lg">
            <div className="font-bold text-white">Calculation Formula & Assumptions:</div>
            <div>• Manual baseline review time: 5.0 minutes per SI-BL document pair.</div>
            <div>• ShipSure AI assisted verification time: 1.5 minutes per case (including human oversight).</div>
            <div>• Operations staff cost basis: $45.00 / hour.</div>
            <div>• Average carrier amendment charge / delayed manifest penalty: $2,500 per bill of lading.</div>
          </div>
        )}
      </div>

      {/* Verification Summary*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Total Cases</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCases}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Clean Cases</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{okCases}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Mismatches</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{mismatchCases}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Needs Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{reviewCases}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Mismatch Rate</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{mismatchRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Field Mismatch Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Field Mismatch Distribution
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-3">
          Number of cases with discrepancies by field
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 20,
              }}
            > 
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="field"
                tick={{ fontSize: 10 }}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                backgroundColor: "#eff1f5",
                borderRadius: "8px",
                color: "#230860",
                fontSize: "12px",
              }}
              />
              <Bar
                dataKey="count"
                fill="#230860"
                radius={[4, 4, 0, 0]}
                onClick={(entry: any) => {
                  const targetKey = entry?.payload?.key || entry?.key;
                  if (targetKey) {
                    onSelectFieldDrillDown(
                      targetKey as ComparisonField
                    );
                  }
                }}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
        {/* Verification Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Verification Outcome Distribution
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated clean passes vs confirmed defects vs reviews
              </p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-medium mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Field Comparison Status*/}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI Confidence: Field Comparison Status
            </h3>
            <p className="text-[11px] text-slate-500">
              Breakdown of individual field-level comparison results
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
  );
};