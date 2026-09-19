/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
import { Users } from "lucide-react";
import { datasetProvider } from "./services/datasetProvider";
import { ComparisonField, EmailRecord, GlobalDateFilter, ShipmentCase } from "./types";
import { InterpretedSearchQuery } from "./services/agents";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<GlobalDateFilter>({ preset: "TODAY" });
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [visionOcrOpen, setVisionOcrOpen] = useState(false);
  const [cases, setCases] = useState<ShipmentCase[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [initialFilterField, setInitialFilterField] = useState<ComparisonField | undefined>(undefined);

  // Reload data from provider
  const refreshData = () => {
    setCases([...datasetProvider.getCases()]);
    setEmails([...datasetProvider.getEmails()]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const humanReviewCount = cases.filter(
    (c) => c.verificationStatus === "NEEDS_REVIEW" || (c.hasRevision && c.revisionComparison?.overallOutcome === "NEEDS_HUMAN_REVIEW")
  ).length;

  const mismatchCount = cases.filter((c) => c.verificationStatus === "MISMATCH").length;

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  // Handlers
  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab("verification");
  };

  const handleStartPriority = () => {
    // Find highest priority mismatch or review case
    const priorityCase = [...cases]
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
    if (!interpreted) return;
    if (interpreted.targetTab) {
      setActiveTab(interpreted.targetTab);
    }
    if (interpreted.targetCaseId) {
      setSelectedCaseId(interpreted.targetCaseId);
      setActiveTab("verification");
    }
  };

  const handleFieldDrillDown = (field: ComparisonField) => {
    setInitialFilterField(field);
    setActiveTab("shipments");
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* Top Application Header */}
      <Header
        currentDateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onOpenCopilot={() => setCopilotOpen(!copilotOpen)}
        copilotOpen={copilotOpen}
        onStartPriorityCase={handleStartPriority}
        onSearch={handleSearchInterpreted}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenVisionOcr={() => setVisionOcrOpen(true)}
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
              cases={cases}
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
              emails={emails}
              cases={cases}
              onSelectCase={handleOpenCase}
              onAskCopilotAboutEmail={handleAskCopilotAboutEmail}
            />
          )}

          {activeTab === "shipments" && (
            <ShipmentsView
              cases={cases}
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
              cases={cases}
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
              cases={cases}
              onOpenCase={handleOpenCase}
              onNavigateToHumanReview={() => setActiveTab("human-review")}
            />
          )}

          {activeTab === "watchdog" && <WatchdogView />}

          {activeTab === "analytics" && (
            <AnalyticsView
              cases={cases}
              onSelectFieldDrillDown={handleFieldDrillDown}
            />
          )}

          {activeTab === "agents" && (
            <AgentActivityView
              cases={cases}
              onOpenCase={handleOpenCase}
            />
          )}

          {activeTab === "evaluation" && <EvaluationView />}

          {activeTab === "settings" && <SettingsView />}
        </main>

        {/* Floating Quick Launcher Trigger (when chatbox is closed) */}
        {!copilotOpen && (
          <button
            id="btn-floating-multi-agent"
            onClick={() => setCopilotOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl px-4 py-3 flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer border border-blue-400/40 select-none animate-in fade-in"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Multi-Agent Chat</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-blue-100 font-medium">
                7 Agents Active • {selectedCase?.shipmentReference || "Live Ops"}
              </div>
            </div>
          </button>
        )}

        {/* Multi-Agent Operations War Room Chatbox */}
        <MultiAgentChatbox
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          cases={cases}
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

        {/* AI Multimodal Vision & OCR Reader Modal for Hard-to-read Scans, Messy PDFs, and Tables */}
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
          onSendToReviewWithCandidates={(caseId, candidates) => {
            setSelectedCaseId(caseId);
            setActiveTab("human-review");
          }}
        />
      </div>
    </div>
  );
}
