import React from "react";
import { 
  LayoutDashboard, 
  Inbox, 
  FileCheck2, 
  UserCheck, 
  GitCompare, 
  ShieldAlert, 
  BarChart3, 
  Activity, 
  FileSpreadsheet, 
  Settings,
  HelpCircle,
  Cpu
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  humanReviewCount: number;
  mismatchCount: number;
  onOpenChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  humanReviewCount,
  mismatchCount,
  onOpenChat
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inbox", label: "Intelligent Inbox", icon: Inbox },
    { id: "shipments", label: "Shipments & Verification", icon: FileCheck2, badge: mismatchCount > 0 ? `${mismatchCount} Discrepancies` : undefined, badgeColor: "bg-red-100 text-red-700" },
    { id: "human-review", label: "Human Review", icon: UserCheck, badge: humanReviewCount > 0 ? `${humanReviewCount}` : undefined, badgeColor: "bg-amber-100 text-amber-800" },
    { id: "revision", label: "Revision Intelligence", icon: GitCompare },
    { id: "watchdog", label: "Proactive Watchdog", icon: ShieldAlert },
    { id: "analytics", label: "Analytics & Trends", icon: BarChart3 },
    { id: "agents", label: "Agent Activity & Audit", icon: Activity },
    { id: "evaluation", label: "Evaluation & Scoring", icon: FileSpreadsheet },
  ];

  return (
    <aside id="shipsure-sidebar" className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-800">
      {/* Top Nav Items */}
      <div className="p-3">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Operations Control
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor || "bg-slate-700 text-slate-200"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings & System Status */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          id="nav-settings"
          onClick={() => onSelectTab("settings")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === "settings"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Dataset & Settings</span>
        </button>

        {/* Multi-Agent Heartbeat Indicator & Chatbox Trigger */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 text-[11px] text-slate-400 mt-2 border border-slate-700/50">
          <div className="flex items-center justify-between font-medium text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Multi-Agent Engine
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
              7 Online
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug mb-2">
            Deterministic matching with GenAI reasoning & Zero-Guess critic gates.
          </p>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold py-1.5 px-2 rounded-md transition shadow-xs cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Launch Multi-Agent Chat</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
