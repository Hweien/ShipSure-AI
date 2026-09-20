/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { InboxView } from "./components/InboxView";
import { ShipmentsView } from "./components/ShipmentsView";
import { VerificationView } from "./components/VerificationView";
import { HumanReviewView } from "./components/HumanReviewView";
import { RevisionView } from "./components/RevisionView";
import { WatchdogView } from "./components/WatchdogView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AgentActivityView } from "./components/AgentActivityView";
import { EvaluationView } from "./components/EvaluationView";
import { SettingsView } from "./components/SettingsView";
import { MultiAgentChatbox } from "./components/MultiAgentChatbox";
import { VisionOcrModal } from "./components/VisionOcrModal";
import { LandingHero } from "./components/LandingHero";
import { Users } from "lucide-react";
import { datasetProvider } from "./services/datasetProvider";
import { ComparisonField, EmailRecord, GlobalDateFilter, ShipmentCase } from "./types";
import { InterpretedSearchQuery } from "./services/agents";


export default function App() {
  const hasTestedProcessEmail = useRef(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<GlobalDateFilter>({ preset: "TODAY" });
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [visionOcrOpen, setVisionOcrOpen] = useState(false);
  const [cases, setCases] = useState<ShipmentCase[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [initialFilterField, setInitialFilterField] = useState<ComparisonField | undefined>(undefined);

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Reload data from provider
  const refreshData = async () => {
    try {
      await datasetProvider.loadFromBackend();

      setCases([...datasetProvider.getCases()]);
      setEmails([...datasetProvider.getEmails()]);
    } catch (error) {
      console.error("Failed to load ShipSure dataset:", error);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  // Smooth scroll to the operations workspace when clicking "Explore"
  const handleScrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = formatLocalDate(today);
  const yesterdayStr = formatLocalDate(yesterday);

  const isWithinLastDays = (
    dateString: string,
    days: number
  ) => {
    const itemDate = new Date(dateString);
    const now = new Date();

    const start = new Date(now);
    start.setDate(now.getDate() - days);

    return itemDate >= start && itemDate <= now;
  };
  
  // Synchronize Global Date Filter across all data
  const filteredCases = cases.filter((c) => {
    const dateStr = c.receivedDate ?? "";

    if (dateFilter.preset === "TODAY") {
      return dateStr.startsWith(todayStr);
    }

    if (dateFilter.preset === "YESTERDAY") {
      return dateStr.startsWith(yesterdayStr);
    }

    if (dateFilter.preset === "LAST_7_DAYS") {
      return isWithinLastDays(dateStr, 7);
    }

    if (dateFilter.preset === "LAST_30_DAYS") {
      return isWithinLastDays(dateStr, 30);
    }

    if (
      dateFilter.preset === "CUSTOM" &&
      dateFilter.startDate &&
      dateFilter.endDate
    ) {
      const itemDate = dateStr.split("T")[0];

      return (
        itemDate >= dateFilter.startDate &&
        itemDate <= dateFilter.endDate
      );
    }

    return true;
  });

  // Replace e.date with the correct property from your EmailRecord type
  const filteredEmails = emails.filter((e) => {
    // Docker email records may not contain a date.
    // Keep undated emails visible.
    if (!e.date) {
      return true;
    }

    const dateStr = e.date;

    if (dateFilter.preset === "TODAY") {
      return dateStr.startsWith(todayStr);
    }

    if (dateFilter.preset === "YESTERDAY") {
      return dateStr.startsWith(yesterdayStr);
    }

    if (dateFilter.preset === "LAST_7_DAYS") {
      return isWithinLastDays(dateStr, 7);
    }

    if (dateFilter.preset === "LAST_30_DAYS") {
      return isWithinLastDays(dateStr, 30);
    }

    if (
      dateFilter.preset === "CUSTOM" &&
      dateFilter.startDate &&
      dateFilter.endDate
    ) {
      const itemDate = dateStr.split("T")[0];

      return (
        itemDate >= dateFilter.startDate &&
        itemDate <= dateFilter.endDate
      );
    }

    return true;
  });

  const humanReviewCount = filteredCases.filter(
    (c) => c.verificationStatus === "NEEDS_REVIEW" || (c.hasRevision && c.revisionComparison?.overallOutcome === "NEEDS_HUMAN_REVIEW")
  ).length;

  const mismatchCount = filteredCases.filter((c) => c.verificationStatus === "MISMATCH").length;

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  // Handlers
  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab("verification");
  };

  const handleStartPriority = () => {
    const priorityCase = [...filteredCases]
      .filter((c) => c.verificationStatus === "MISMATCH" || c.verificationStatus === "NEEDS_REVIEW")
      .sort((a, b) => b.priorityScore - a.priorityScore)[0];

    if (priorityCase) {
      setSelectedCaseId(priorityCase.id);
      setActiveTab("verification");
    } else {
      setActiveTab("shipments");
    }
  };

  const handleAskCopilotAboutCase = (caseObj: ShipmentCase) => {
    setSelectedCaseId(caseObj.id);
    setCopilotOpen(true);
  };

  const handleAskCopilotAboutEmail = (email: EmailRecord) => {
    const relatedCase = cases.find((c) => c.emailId === email.email_id);
    if (relatedCase) {
      setSelectedCaseId(relatedCase.id);
    }
    setCopilotOpen(true);
  };

  const handleExecuteAction = (actionId: string, payload?: any) => {
    if (actionId === "BRIEFING") {
      setActiveTab("dashboard");
    } else if (actionId === "INVESTIGATE_CASE" && payload) {
      setSelectedCaseId(payload);
      setActiveTab("verification");
    } else if (actionId === "CHECK_REVISION") {
      setActiveTab("revision");
    } else if (actionId === "OPEN_SIDE_BY_SIDE" && payload) {
      setSelectedCaseId(payload);
      setActiveTab("verification");
    } else if (actionId === "DRAFT_AMENDMENT" && payload) {
      setSelectedCaseId(payload);
      setActiveTab("verification");
    } else if (actionId === "OPEN_HUMAN_QUEUE") {
      setActiveTab("human-review");
    } else if (actionId === "OPEN_ANALYTICS") {
      setActiveTab("analytics");
    }
  };

  const handleSearchInterpreted = (interpreted: InterpretedSearchQuery | null) => {
    if (!interpreted) {
      setInitialFilterField(undefined);
      return;
    }

    if (interpreted.targetCaseId) {
      const match = cases.find(
        (c) =>
          c.id.toLowerCase() === interpreted.targetCaseId?.toLowerCase() ||
          c.shipmentReference.toLowerCase().includes(interpreted.targetCaseId?.toLowerCase() || "")
      );
      if (match) {
        setSelectedCaseId(match.id);
        setActiveTab("verification");
        return;
      }
    }

    if (interpreted.field) {
      setInitialFilterField(interpreted.field);
      setActiveTab("shipments");
      return;
    }

    if (interpreted.targetTab) {
      setActiveTab(interpreted.targetTab);
      return;
    }

    if (interpreted.status === "MISMATCH" || interpreted.status === "NEEDS_REVIEW") {
      setActiveTab("shipments");
      return;
    }
  };

  const handleFieldDrillDown = (field: ComparisonField) => {
    setInitialFilterField(field);
    setActiveTab("shipments");
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans scroll-smooth overflow-x-hidden">
      {/* 1. FRONT HERO COVER (Glassy Landing Section with Motion Background) */}
      <LandingHero onExplore={handleScrollToWorkspace} />

      {/* 2. OPERATIONS WORKSPACE (The Main Dashboard & Control Hub) */}
      <div
        id="operations-workspace"
        ref={workspaceRef}
        className="flex flex-col h-screen w-full overflow-hidden bg-slate-100 text-slate-900 border-t border-slate-800"
      >
        {/* Top Application Header */}
        <Header
          currentDateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onOpenCopilot={() => setCopilotOpen(!copilotOpen)}
          copilotOpen={copilotOpen}
          onStartPriorityCase={handleStartPriority}
          onSearch={handleSearchInterpreted}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Main App Layout */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab === "verification" ? "shipments" : activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              if (tab !== "verification") {
                setInitialFilterField(undefined);
              }
            }}
            humanReviewCount={humanReviewCount}
            mismatchCount={mismatchCount}
            onOpenChat={() => setCopilotOpen(true)}
          />

          {/* Dynamic Center Stage */}
          <main className="flex-1 overflow-y-auto bg-slate-50 relative">
            {activeTab === "dashboard" && (
              <DashboardView
                cases={filteredCases}
                dateFilter={dateFilter}
                onNavigate={(tab, caseId) => {
                  if (caseId) {
                    setSelectedCaseId(caseId);
                    setActiveTab("verification");
                  } else {
                    setActiveTab(tab);
                  }
                }}
                onStartPriority={handleStartPriority}
              />
            )}

            {activeTab === "inbox" && (
              <InboxView
                emails={filteredEmails}
                cases={filteredCases}
                onSelectCase={handleOpenCase}
                onAskCopilotAboutEmail={handleAskCopilotAboutEmail}
              />
            )}

            {activeTab === "shipments" && (
              <ShipmentsView
                cases={filteredCases}
                onSelectCase={handleOpenCase}
                onOpenRevision={(caseId) => {
                  setSelectedCaseId(caseId);
                  setActiveTab("revision");
                }}
                initialFilterField={initialFilterField}
              />
            )}

            {activeTab === "verification" && selectedCase && (
              <VerificationView
                shipmentCase={selectedCase}
                onBack={() => setActiveTab("shipments")}
                onAskCopilot={handleAskCopilotAboutCase}
                onSendToHumanReview={(caseId) => {
                  setSelectedCaseId(caseId);
                  setActiveTab("human-review");
                }}
                onOpenVisionOcr={() => setVisionOcrOpen(true)}
              />
            )}

            {activeTab === "human-review" && (
              <HumanReviewView
                cases={filteredCases}
                onOpenCase={handleOpenCase}
                onRefreshCases={refreshData}
                onOpenVisionOcr={(caseId) => {
                  if (caseId) setSelectedCaseId(caseId);
                  setVisionOcrOpen(true);
                }}
              />
            )}

            {activeTab === "revision" && (
              <RevisionView
                cases={filteredCases}
                onOpenCase={handleOpenCase}
                onNavigateToHumanReview={(caseId) => {
                  setSelectedCaseId(caseId);
                  setActiveTab("human-review");
                }}
              />
            )}

            {activeTab === "watchdog" && <WatchdogView cases={filteredCases} />}

            {activeTab === "analytics" && (
              <AnalyticsView
                cases={filteredCases}
                onSelectFieldDrillDown={handleFieldDrillDown}
              />
            )}

            {activeTab === "agents" && (
              <AgentActivityView
                cases={filteredCases}
                onOpenCase={handleOpenCase}
              />
            )}

            {activeTab === "evaluation" && <EvaluationView />}

            {/* ✅ Passed onRefreshData={refreshData} */}
            {activeTab === "settings" && <SettingsView onRefreshData={refreshData} />}
          </main>

          {/* Compact Floating Quick Launcher */}
          {!copilotOpen && (
            <button
              id="btn-floating-multi-agent"
              onClick={() => setCopilotOpen(true)}
              title="Open Multi-Agent War Room (7 Agents Online)"
              className="group fixed bottom-5 right-5 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl p-3 flex items-center gap-2.5 transition-all duration-200 hover:pr-4 cursor-pointer border border-blue-400/30 select-none animate-in fade-in"
            >
              {/* Icon with active pulse dot */}
              <div className="relative flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600 animate-pulse" />
              </div>

              {/* Text expands smoothly on hover */}
              <div className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-left">
                <div className="text-xs font-bold leading-tight">Multi-Agent Chat</div>
                <div className="text-[10px] text-blue-200">7 Online</div>
              </div>
            </button>
          )}

          {/* Multi-Agent Operations War Room Chatbox */}
          <MultiAgentChatbox
            isOpen={copilotOpen}
            onClose={() => setCopilotOpen(false)}
            cases={filteredCases}
            activeCase={selectedCase}
            currentDateFilter={dateFilter}
            onNavigateToCase={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveTab("verification");
            }}
            onNavigateToRevision={(caseId) => {
              if (caseId) setSelectedCaseId(caseId);
              setActiveTab("revision");
            }}
            onNavigateToHumanReview={() => setActiveTab("human-review")}
            onNavigateToWatchdog={() => setActiveTab("watchdog")}
            onNavigateToShipments={() => setActiveTab("shipments")}
          />

          {/* AI Multimodal Vision & OCR Reader Modal */}
          <VisionOcrModal
            isOpen={visionOcrOpen}
            onClose={() => setVisionOcrOpen(false)}
            activeCase={selectedCase}
            onApplyExtractedFields={(fields) => {
              if (selectedCase) {
                datasetProvider.updateHumanReview(selectedCase.id, {
                  reviewer: "AI Vision OCR Engine (Gemini 3.8 Flash)",
                  approvedStatus: "OK",
                  comments: "Updated fields directly from Multimodal Vision model OCR extraction pass.",
                  manualOverrides: {
                    gross_weight_kg: fields.gross_weight_kg?.value ? `${fields.gross_weight_kg.value} KG` : undefined,
                    container_count: fields.container_count?.value ? String(fields.container_count.value) : undefined,
                    shipper: fields.shipper?.value,
                    consignee: fields.consignee?.value,
                  }
                });
                refreshData();
              }
            }}
            onSendToReviewWithCandidates={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveTab("human-review");
            }}
          />
        </div>
      </div>
    </div>
  );
}