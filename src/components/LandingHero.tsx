import React from "react";
import shipsureLogo from "../../shipsure-logo.svg";
import {
  ArrowDown,
  ShieldCheck,
  Cpu,
  FileCheck2,
  GitCompare,
  Sparkles,
  ChevronDown,
  Anchor
} from "lucide-react";


interface LandingHeroProps {
  onExplore: () => void;
}


export const LandingHero: React.FC<LandingHeroProps> = ({ onExplore }) => {
  return (
    <section
      id="landing-hero"
      className="relative min-h-screen w-full flex flex-col justify-between items-center px-4 py-8 sm:px-8 sm:py-10 overflow-hidden bg-slate-950 text-white select-none"
    >
      {/* =========================================================
          SEAMLESS MARITIME BACKGROUND
         ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Ambient Glow Spheres */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />


        {/* Seamless Background Coordinates & Flowing Routes */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="maritime-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="rgba(255, 255, 255, 0.25)" />
            </pattern>
            <linearGradient id="lane-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>


          <rect width="100%" height="100%" fill="url(#maritime-dots)" />


          <path
            d="M -100 200 C 300 100, 600 400, 1100 250 S 1600 500, 2100 300"
            fill="none"
            stroke="url(#lane-gradient)"
            strokeWidth="2.5"
            strokeDasharray="8 8"
            className="animate-sea-lane"
          />
          <path
            d="M -50 450 C 400 350, 750 650, 1250 400 S 1750 200, 2200 450"
            fill="none"
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="animate-sea-lane-reverse"
          />
        </svg>


        {/* HUD Route Labels (Properly padded so they don't clip off edges) */}
        <div className="absolute top-10 left-6 sm:left-10 hidden sm:flex items-center gap-2 text-[11px] font-mono tracking-widest text-cyan-400/60 uppercase">
          <Anchor className="w-3.5 h-3.5 text-cyan-400/70" />
          <span>ROUTE: PKL (PORT KLANG) → NLRTM (ROTTERDAM)</span>
        </div>


        <div className="absolute bottom-12 right-6 sm:right-10 hidden sm:flex items-center gap-2 text-[11px] font-mono tracking-widest text-indigo-300/60 uppercase">
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-400/70" />
          <span>7-FIELD DETERMINISTIC ENGINE ACTIVE</span>
        </div>
      </div>


      {/* Top Header: Swarm Status Indicator */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-end">
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2 bg-slate-900/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Multi-Agent Swarm Online (7 Agents)</span>
        </div>
      </header>


      {/* Center Stage: Direct Typography (NO Outer Glass Box) */}
      <main className="relative z-10 my-auto max-w-4xl w-full text-center space-y-6 px-4">
        {/* Brand Logo */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
          <div
            className="absolute inset-3 rounded-full bg-cyan-400/25 blur-2xl animate-pulse"
            aria-hidden="true"
          />
          <img
            src={shipsureLogo}
            alt="ShipSure AI logo"
            className="relative w-full h-full object-contain drop-shadow-2xl"
          />
        </div>


        {/* Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Autonomous Shipping Documentation Intelligence</span>
        </div>


        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">ShipSure-AI</span>
        </h1>


        {/* 4 Pillars Mantra */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-base sm:text-xl font-bold tracking-widest uppercase">
          <span className="text-blue-400">Detect</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-300">Verify</span>
          <span className="text-slate-600">•</span>
          <span className="text-indigo-400">Resolve</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">Learn</span>
        </div>


        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-normal">
          ShipSure AI is a multi-agent platform that automates shipping document verification by classifying emails, comparing SI and BL details, and detecting discrepancies. It combines AI Copilot, human review, and intelligent workflow automation to make shipping operations faster, more reliable, and transparent.
        </p>


        {/* 4 Capability Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left pt-2 max-w-3xl mx-auto">
          <div className="p-3.5 bg-slate-900/40 border border-white/10 rounded-xl hover:border-blue-400/40 backdrop-blur-md transition">
            <FileCheck2 className="w-4 h-4 text-blue-400 mb-1.5" />
            <div className="text-xs font-bold text-white">7 Core Fields</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Strict SI vs Draft BL cross-check</div>
          </div>


          <div className="p-3.5 bg-slate-900/40 border border-white/10 rounded-xl hover:border-cyan-400/40 backdrop-blur-md transition">
            <GitCompare className="w-4 h-4 text-cyan-400 mb-1.5" />
            <div className="text-xs font-bold text-white">3-Way Diff Matrix</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Catches unsolicited BL V2 edits</div>
          </div>


          <div className="p-3.5 bg-slate-900/40 border border-white/10 rounded-xl hover:border-amber-400/40 backdrop-blur-md transition">
            <ShieldCheck className="w-4 h-4 text-amber-300 mb-1.5" />
            <div className="text-xs font-bold text-white">Zero-Guess Policy</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Optical smudges routed to humans</div>
          </div>


          <div className="p-3.5 bg-slate-900/40 border border-white/10 rounded-xl hover:border-indigo-400/40 backdrop-blur-md transition">
            <Cpu className="w-4 h-4 text-indigo-400 mb-1.5" />
            <div className="text-xs font-bold text-white">Multi-Agent Hub</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Collaborative operational triage</div>
          </div>
        </div>


        {/* CTA Button */}
        <div className="pt-4 flex items-center justify-center">
          <button
            onClick={onExplore}
            id="btn-explore-shipsure"
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-900/40 hover:shadow-blue-700/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-cyan-300/30"
          >
            <span>Explore ShipSure-AI</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </main>


      {/* Footer Scroll Prompt */}
      <footer
        className="relative z-10 flex flex-col items-center gap-1.5 text-xs text-slate-400 cursor-pointer pt-4"
        onClick={onExplore}
      >
        <span className="text-[11px] font-medium tracking-wide">Scroll down to Operations Control Hub</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
      </footer>
    </section>
  );
};

