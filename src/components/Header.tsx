import React, { useState } from "react";
import {
  Search,
  Calendar,
  Bot,
  PlayCircle,
  X,
  Sparkles,
  ArrowRight
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
    if (val.trim().length >= 2) {
      const interpreted = interpretNaturalLanguageQuery(val);
      setInterpretedQuery(interpreted);
      onSearch(interpreted);
    } else {
      setInterpretedQuery(null);
      onSearch(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && interpretedQuery) {
      e.preventDefault();
      onSearch(interpretedQuery);
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
            onKeyDown={handleKeyDown}
            placeholder="Natural search (e.g. 'Weight mismatches', 'SHP-8291', 'Human review')..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Interpretation Tooltip Banner */}
        {interpretedQuery && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-blue-200 rounded-lg p-2.5 shadow-lg text-xs z-50 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 text-blue-900 truncate">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">
                AI Filter: <strong>{interpretedQuery.explanation}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onSearch(interpretedQuery)}
                className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
              >
                <span>Apply</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={clearSearch}
                className="text-slate-400 hover:text-slate-600 text-[11px] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Date Filter, Priority Action, Copilot Toggle */}
      <div className="flex items-center gap-3">
        {/* Global Date Filter Box */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
          
          {/* Dropdown Select */}
          <select
            id="global-date-selector"
            value={currentDateFilter.preset}
            onChange={(e) => onDateFilterChange({ 
              ...currentDateFilter, 
              preset: e.target.value as any,
              startDate: e.target.value === "CUSTOM" ? (currentDateFilter.startDate || "2026-09-15") : undefined,
              endDate: e.target.value === "CUSTOM" ? (currentDateFilter.endDate || "2026-09-19") : undefined
            })}
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

          {/* Date Pickers appear beside the select when CUSTOM is chosen */}
          {currentDateFilter.preset === "CUSTOM" && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-2">
              <input
                type="date"
                value={currentDateFilter.startDate || "2026-09-15"}
                onChange={(e) =>
                  onDateFilterChange({
                    ...currentDateFilter,
                    startDate: e.target.value,
                  })
                }
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
              />
              <span className="text-slate-400 text-[10px]">to</span>
              <input
                type="date"
                value={currentDateFilter.endDate || "2026-09-19"}
                onChange={(e) =>
                  onDateFilterChange({
                    ...currentDateFilter,
                    endDate: e.target.value,
                  })
                }
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
              />
            </div>
          )}
        </div>

        {/* 1-Click Colorblind / High-Contrast Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              document.body.classList.toggle("colorblind-mode");
            }}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Toggle WCAG High Contrast / Colorblind Accessibility Mode"
          >
            <span>👁️</span>
            <span className="hidden lg:inline">Accessible Mode</span>
          </button>

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
      </div>
    </header>
  );
};