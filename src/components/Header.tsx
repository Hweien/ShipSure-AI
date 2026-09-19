import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  Bot, 
  PlayCircle, 
  SlidersHorizontal,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Camera
} from "lucide-react";
import { GlobalDateFilter } from "../types";
import { interpretNaturalLanguageQuery, InterpretedSearchQuery } from "../services/agents";

interface HeaderProps {
  currentDateFilter: GlobalDateFilter;
  onDateFilterChange: (filter: GlobalDateFilter) => void;
  onOpenCopilot: () => void;
  copilotOpen: boolean;
  onStartPriorityCase: () => void;
  onSearch: (interpreted: InterpretedSearchQuery | null) => void;
  onNavigate: (tab: string) => void;
  onOpenVisionOcr?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateFilter,
  onDateFilterChange,
  onOpenCopilot,
  copilotOpen,
  onStartPriorityCase,
  onSearch,
  onNavigate,
  onOpenVisionOcr
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [interpretedQuery, setInterpretedQuery] = useState<InterpretedSearchQuery | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (val.trim().length > 2) {
      const interpreted = interpretNaturalLanguageQuery(val);
      setInterpretedQuery(interpreted);
      onSearch(interpreted);
    } else {
      setInterpretedQuery(null);
      onSearch(null);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setInterpretedQuery(null);
    onSearch(null);
  };

  return (
    <header id="shipsure-header" className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            SS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-base">SHIP SURE AI</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Operations Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium -mt-0.5">Detect • Verify • Resolve • Learn</p>
          </div>
        </div>
      </div>

      {/* Center: Natural Language Search with Live Interpreter */}
      <div className="flex-1 max-w-xl mx-8 relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Natural search (e.g., 'Weight mismatches last week' or 'SHP-8291')..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-9 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {interpretedQuery && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-blue-200 rounded-lg p-2.5 shadow-lg text-xs z-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Interpreted Filter: <strong>{interpretedQuery.explanation}</strong></span>
            </div>
            <button
              onClick={clearSearch}
              className="text-slate-500 hover:text-slate-800 text-[11px] underline ml-2"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Right: Date Filter, Priority Action, Copilot Toggle */}
      <div className="flex items-center gap-3">
        {/* Global Date Filter Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <select
            id="global-date-selector"
            value={currentDateFilter.preset}
            onChange={(e) => onDateFilterChange({ preset: e.target.value as any })}
            className="bg-transparent border-none text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="TODAY">Today (Sep 19)</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
        </div>

        {/* Start Next Priority Case Button */}
        <button
          id="btn-start-priority"
          onClick={onStartPriorityCase}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs cursor-pointer"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Priority Queue</span>
        </button>

        {/* Multi-Agent Chatbox Toggle Button */}
        <button
          id="btn-toggle-copilot"
          onClick={onOpenCopilot}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition cursor-pointer ${
            copilotOpen
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
          }`}
        >
          <Bot className={`w-3.5 h-3.5 ${copilotOpen ? "text-white" : "text-blue-600"}`} />
          <span>Multi-Agent Chat</span>
          <span className={`text-[10px] px-1 rounded font-bold ${copilotOpen ? "bg-blue-700 text-blue-100" : "bg-emerald-100 text-emerald-800"}`}>
            7
          </span>
        </button>

        {/* AI Vision Model & OCR Reader Trigger */}
        {onOpenVisionOcr && (
          <button
            id="btn-header-vision-ocr"
            onClick={onOpenVisionOcr}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
            title="Launch AI Vision Model & OCR Reader for Messy Scans"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Vision OCR</span>
          </button>
        )}
      </div>
    </header>
  );
};
