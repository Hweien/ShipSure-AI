import React, { useState } from "react";
import { 
  FileCheck2, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  ChevronRight,
  GitCompare,
  ArrowRight
} from "lucide-react";
import { ComparisonField, ShipmentCase, VerificationStatus } from "../types";

interface ShipmentsViewProps {
  cases: ShipmentCase[];
  onSelectCase: (caseId: string) => void;
  onOpenRevision: (caseId: string) => void;
  initialFilterField?: ComparisonField;
}

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  cases,
  onSelectCase,
  onOpenRevision,
  initialFilterField
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fieldFilter, setFieldFilter] = useState<string>(initialFilterField || "ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const comparisonCases = cases.filter((c) => c.category === "BL_COMPARISON");

  const filteredCases = comparisonCases.filter((c) => {
    if (statusFilter !== "ALL" && c.verificationStatus !== statusFilter) {
      return false;
    }
    if (fieldFilter !== "ALL" && !c.defectFields.includes(fieldFilter as ComparisonField)) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRef = c.shipmentReference.toLowerCase().includes(q);
      const matchSub = c.emailSubject.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      return matchRef || matchSub || matchId;
    }
    return true;
  });

  const getStatusBadge = (status: VerificationStatus, hasDefect: boolean) => {
    switch (status) {
      case "OK":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            No Mismatch
          </span>
        );
      case "MISMATCH":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Mismatch Flagged
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            Needs Review
          </span>
        );
    }
  };

  return (
    <div id="shipments-view" className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            Shipment Verification & Cases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Document verification requests comparing Shipping Instructions (SI) vs Draft Bills of Lading (BL).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or subject..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="MISMATCH">Mismatches Only</option>
          <option value="OK">OK (Matches)</option>
          <option value="NEEDS_REVIEW">Needs Human Review</option>
        </select>

        {/* Field Filter */}
        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Discrepancy Fields</option>
          <option value="container_count">Container Count</option>
          <option value="gross_weight_kg">Gross Weight (KG)</option>
          <option value="port_of_discharge">Port of Discharge</option>
          <option value="port_of_loading">Port of Loading</option>
          <option value="shipper">Shipper</option>
          <option value="consignee">Consignee</option>
          <option value="notify_party">Notify Party</option>
        </select>

        {(statusFilter !== "ALL" || fieldFilter !== "ALL" || searchQuery) && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setFieldFilter("ALL");
              setSearchQuery("");
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-4">Case / Shipment Ref</th>
              <th className="py-3 px-4">Verification Status</th>
              <th className="py-3 px-4">Discrepancy Fields</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Human Action</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCases.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className="hover:bg-blue-50/40 transition cursor-pointer"
              >
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 text-xs">{c.shipmentReference}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.emailSubject}</div>
                </td>
                <td className="py-3.5 px-4">
                  {getStatusBadge(c.verificationStatus, c.hasDefect)}
                </td>
                <td className="py-3.5 px-4">
                  {c.defectFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {c.defectFields.map((f, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 rounded"
                        >
                          {f.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : c.reviewReason ? (
                    <span className="text-[11px] text-amber-700 font-medium">
                      Reason: {c.reviewReason.replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-medium">None</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className={`w-2 h-2 rounded-full ${
                      c.priorityScore >= 80 ? "bg-red-500" : c.priorityScore >= 50 ? "bg-amber-500" : "bg-emerald-400"
                    }`} />
                    {c.priorityScore}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">BL V{c.blVersion}</span>
                    {c.hasRevision && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-purple-100 text-purple-800 rounded font-semibold border border-purple-200">
                        Revised
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {c.humanReviewed ? (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved
                    </span>
                  ) : c.verificationStatus === "NEEDS_REVIEW" ? (
                    <span className="text-[11px] text-amber-700 font-medium">Review Pending</span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Autonomous</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {c.hasRevision && (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onOpenRevision(c.id);
                        }}
                        className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold px-2 py-1 rounded transition border border-purple-200 flex items-center gap-1"
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>Diff V1/V2</span>
                      </button>
                    )}
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSelectCase(c.id);
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded transition flex items-center gap-1"
                    >
                      <span>Compare</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
