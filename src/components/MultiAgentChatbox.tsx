/**
 * ShipSure AI - Multi-Agent Collaborative War Room Chatbox
 * Real-time inter-agent collaboration, deterministic discrepancy analysis,
 * zero-guess audit gates, 3-way version reconciliation, and carrier amendment generation.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  FileCode2,
  GitCompare,
  Eye,
  Crown,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Layers,
  MessageSquare,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  MailCheck,
  SendHorizontal
} from "lucide-react";
import {
  AgentId,
  AGENT_PERSONAS,
  MultiAgentChatMessage,
  runMultiAgentCollaboration,
  extractMentionedAgent,
  extractCaseReference
} from "../services/multiAgentChat";
import { GlobalDateFilter, ShipmentCase } from "../types";

interface MultiAgentChatboxProps {
  isOpen: boolean;
  onClose: () => void;
  cases: ShipmentCase[];
  activeCase?: ShipmentCase;
  currentDateFilter: GlobalDateFilter;
  onNavigateToCase: (caseId: string) => void;
  onNavigateToRevision: (caseId?: string) => void;
  onNavigateToHumanReview: () => void;
  onNavigateToWatchdog: () => void;
  onNavigateToShipments: () => void;
}

export const MultiAgentChatbox: React.FC<MultiAgentChatboxProps> = ({
  isOpen,
  onClose,
  cases,
  activeCase: initialActiveCase,
  currentDateFilter,
  onNavigateToCase,
  onNavigateToRevision,
  onNavigateToHumanReview,
  onNavigateToWatchdog,
  onNavigateToShipments
}) => {
  const [mode, setMode] = useState<"collaborative" | "direct">("collaborative");
  const [activeAgentId, setActiveAgentId] = useState<AgentId>("orchestrator");
  const [
    selectedCaseId,
    setSelectedCaseId
  ] = useState<string>(
    initialActiveCase?.id ||
    cases[0]?.id ||
    ""
    );
  
  useEffect(() => {
    if (
      initialActiveCase?.id
    ) {
      setSelectedCaseId(
        initialActiveCase.id
      );

      return;
    }

    if (
      !selectedCaseId &&
      cases.length > 0
    ) {
      setSelectedCaseId(
        cases[0].id
      );
    }
  }, [
    initialActiveCase,
    cases,
    selectedCaseId,
  ]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const activeCase = cases.find((c) => c.id === selectedCaseId) || initialActiveCase || cases[0];

  // Initial welcome multi-agent message
  const [messages, setMessages] = useState<MultiAgentChatMessage[]>([
    {
      id: "init-orch",
      sender: "agent",
      agentId: "orchestrator",
      agentName: AGENT_PERSONAS.orchestrator.name,
      text: `👋 **ShipSure Multi-Agent Operations War Room is Live**.\n\n7 specialized autonomous agents are collaborating on today's shipping documentation pipeline. You can ask for collaborative case investigations, forensic 3-way version reconciliation, zero-guess reliability checks, or carrier amendment drafts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: [
        { label: "🔥 Triage Priority Case SHP-8291", actionId: "INVESTIGATE_CASE", payload: "CASE-8291" },
        { label: "🔄 Reconcile BL V2 (SHP-7612)", actionId: "INVESTIGATE_CASE", payload: "CASE-7612" },
        { label: "🛡️ Audit Optical Smudge (SHP-8411)", actionId: "INVESTIGATE_CASE", payload: "CASE-8411" }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialActiveCase) {
      setSelectedCaseId(initialActiveCase.id);
    }
  }, [initialActiveCase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle Copy Draft Email to Clipboard
  const handleCopyEmail = (body: string, msgId: string) => {
    navigator.clipboard.writeText(body);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Simulate Dispatching to Carrier
  const handleDispatchEmail = (msgId: string) => {
  setDispatchedId(msgId);
  if (activeCase) {
    if (activeCase.draftResolution) {
      activeCase.draftResolution.status = "APPROVED";
    }
    activeCase.timeline.unshift({
      id: `T-DISP-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      agent: "Resolution Agent",
      action: "Carrier Amendment Dispatched",
      summary: `Dispatched formal amendment notice to carrier for ${activeCase.shipmentReference}.`,
      status: "success"
    });
  }
  setTimeout(() => setDispatchedId(null), 3500);
};

  // Execute Agent Action Buttons
  // Inside MultiAgentChatbox.tsx -> handleActionClick:
const handleActionClick = (actionId: string, payload?: any) => {
  if (actionId === "OPEN_CASE" && payload) {
    onNavigateToCase(payload);
  } else if (actionId === "INVESTIGATE_CASE" && payload) {
    setSelectedCaseId(payload);
    const targetCase = cases.find((c) => c.id === payload);
    handleSendMessage(`Investigate case ${targetCase?.shipmentReference || payload} in depth and prepare required carrier actions`);
  } else if (actionId === "NAVIGATE_REVISION") {
    onNavigateToRevision(selectedCaseId);
  } else if (actionId === "NAVIGATE_HUMAN_REVIEW" || actionId === "OPEN_HUMAN_QUEUE") {
    onNavigateToHumanReview();
  } else if (actionId === "NAVIGATE_WATCHDOG") {
    onNavigateToWatchdog();
  } else if (actionId === "FILTER_WEIGHT" || actionId === "NAVIGATE_SHIPMENTS") {
    onNavigateToShipments();
  } else if (actionId === "SIMULATE_SEND") {
    handleDispatchEmail(`act-${Date.now()}`);
  // ✅ FIX 1: Open the Decision Passport tab (agents) instead of verification
  } else if (actionId === "OPEN_PASSPORT" || actionId === "VIEW_PASSPORT") {
    if (payload) setSelectedCaseId(payload);
    onNavigateToCase(payload || selectedCaseId);
  // ✅ FIX 2: Handle Draft Amendment action properly
  } else if (actionId === "DRAFT_AMENDMENT" || actionId === "DRAFT_RESOLUTION") {
    if (payload) setSelectedCaseId(payload);
    onNavigateToCase(payload || selectedCaseId);
  }
};

  // Handle sending a user prompt
  const handleSendMessage =
    async (
      textToSend?: string
    ) => {
      const rawText =
        textToSend ||
        input;

      if (
        !rawText.trim() ||
        loading
      ) {
        return;
      }

      const userText =
        rawText.trim();

      setInput("");

      // --------------------------------------------------
      // Check for @agent mention
      // --------------------------------------------------

      const mentionedAgent =
        extractMentionedAgent(
          userText
        );

      const effectiveAgentId =
        mentionedAgent ||
        (
          mode === "direct"
            ? activeAgentId
            : undefined
        );

      // --------------------------------------------------
      // Resolve case
      // --------------------------------------------------

      const mentionedCase =
        extractCaseReference(
          userText,
          cases
        );

      const targetCase =
        mentionedCase ||
        activeCase;

      if (
        mentionedCase &&
        mentionedCase.id !==
          selectedCaseId
      ) {
        setSelectedCaseId(
          mentionedCase.id
        );
      }

      // --------------------------------------------------
      // Add user message
      // --------------------------------------------------

      const userMsg:
        MultiAgentChatMessage = {
          id:
            `usr-${Date.now()}`,

          sender:
            "user",

          text:
            userText,

          timestamp:
            new Date()
              .toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",

                  minute:
                    "2-digit",
                }
              ),

          contextCaseId:
            targetCase?.id,

          contextShipmentRef:
            targetCase
              ?.shipmentReference,
        };

      setMessages(
        (previous) => [
          ...previous,
          userMsg,
        ]
      );

      // --------------------------------------------------
      // No processed case available
      // --------------------------------------------------

      if (!targetCase) {
        setMessages(
          (previous) => [
            ...previous,

            {
              id:
                `no-case-${Date.now()}`,

              sender:
                "agent",

              agentId:
                "orchestrator",

              agentName:
                AGENT_PERSONAS
                  .orchestrator
                  .name,

              text:
                "No processed shipment case is available yet. Please wait for the document pipeline to complete at least one case.",

              timestamp:
                new Date()
                  .toLocaleTimeString(),
            },
          ]
        );

        return;
      }

      setLoading(true);

      try {
        // ------------------------------------------------
        // REAL BACKEND ORCHESTRATION
        //
        // No Gemini request here.
        // No synthetic scenario.
        // ------------------------------------------------

        const agentResponses =
          await runMultiAgentCollaboration(
            userText,
            targetCase,
            effectiveAgentId
          );

        setMessages(
          (previous) => [
            ...previous,
            ...agentResponses,
          ]
        );
      } catch (
        error: any
      ) {
        console.error(
          "Multi-agent collaboration failed:",
          error
        );

        setMessages(
          (previous) => [
            ...previous,

            {
              id:
                `err-${Date.now()}`,

              sender:
                "agent",

              agentId:
                "orchestrator",

              agentName:
                AGENT_PERSONAS
                  .orchestrator
                  .name,

              text:
                `Unable to load the real orchestration record: ${
                  error?.message ||
                  "Unknown error"
                }.`,

              timestamp:
                new Date()
                  .toLocaleTimeString(
                    [],
                    {
                      hour:
                        "2-digit",

                      minute:
                        "2-digit",
                    }
                  ),
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

  // Render Icon helper for Agent Avatar
  const renderAgentIcon = (id?: AgentId) => {
    switch (id) {
      case "orchestrator":
        return <Crown className="w-4 h-4" />;
      case "verification":
        return <FileCheck2 className="w-4 h-4" />;
      case "extraction":
        return <FileCode2 className="w-4 h-4" />;
      case "critic":
        return <ShieldAlert className="w-4 h-4" />;
      case "revision":
        return <GitCompare className="w-4 h-4" />;
      case "resolution":
        return <SendHorizontal className="w-4 h-4" />;
      case "watchdog":
        return <Eye className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  // Minimized Floating Pill View
  if (isMinimized) {
    return (
      <div
        id="multi-agent-minimized"
        className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition select-none"
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Multi-Agent War Room</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-400">
            {messages.length} messages • Active: {activeCase?.shipmentReference}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Quick Preset Queries
  const quickPresets = [
    {
      label:
        "🔍 Investigate Active Case",

      prompt:
        activeCase
          ? `Investigate ${activeCase.shipmentReference}`
          : "Investigate the active case",
    },

    {
      label:
        "⚖️ Verification Result",

      prompt:
        activeCase
          ? `@verification explain the verification result for ${activeCase.shipmentReference}`
          : "@verification explain the active verification result",
    },

    {
      label:
        "🛡️ Reliability Check",

      prompt:
        activeCase
          ? `@critic review whether ${activeCase.shipmentReference} requires human review`
          : "@critic review the active case",
    },

    {
      label:
        "🔄 Revision Status",

      prompt:
        activeCase
          ? `@revision check revision status for ${activeCase.shipmentReference}`
          : "@revision check the active case",
    },

    {
      label:
        "✉️ Resolution Status",

      prompt:
        activeCase
          ? `@resolution review the resolution workflow for ${activeCase.shipmentReference}`
          : "@resolution review the active case",
    },
  ];

  return (
    <div
      id="multi-agent-chatbox"
      className={`fixed z-50 transition-all duration-300 flex flex-col bg-white border border-slate-200 shadow-2xl overflow-hidden ${
        isExpanded
          ? "inset-4 sm:inset-8 md:inset-12 rounded-2xl"
          : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-full max-w-lg md:max-w-xl h-[680px] rounded-2xl"
      }`}
    >
      {/* 1. Header Bar with Mode Switcher & Controls */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">Multi-Agent Operations War Room</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                7 Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic Orchestration + Verified Case Evidence
            </p>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse to standard size" : "Expand to wide war-room layout"}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize to floating bubble"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close Multi-Agent Chatbox"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Header: Mode Selector & Active Case Context Bar */}
      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        {/* Collaboration vs Direct Mode Tabs */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
          <button
            onClick={() => setMode("collaborative")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              mode === "collaborative"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Team Collaboration</span>
          </button>
          <button
            onClick={() => setMode("direct")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              mode === "direct"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Direct 1-on-1</span>
          </button>
        </div>

        {/* Active Case Context Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Case Context:</span>
          <select
            id="multi-agent-case-select"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shipmentReference} — {c.verificationStatus} {c.hasRevision ? "(V2)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Direct Mode Agent Bar (Visible when in Direct 1-on-1 Mode) */}
      {mode === "direct" && (
        <div className="bg-white px-4 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
          <span className="font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Consult With:
          </span>
          {(Object.keys(AGENT_PERSONAS) as AgentId[]).map((agentKey) => {
            const persona = AGENT_PERSONAS[agentKey];
            const isSelected = activeAgentId === agentKey;
            return (
              <button
                key={agentKey}
                onClick={() => setActiveAgentId(agentKey)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition shrink-0 cursor-pointer border ${
                  isSelected
                    ? `${persona.color.badgeBg} ${persona.color.badgeText} ${persona.color.border} font-bold shadow-2xs`
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {renderAgentIcon(agentKey)}
                <span>{persona.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Chat Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          const persona = m.agentId ? AGENT_PERSONAS[m.agentId] : AGENT_PERSONAS.orchestrator;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full animate-in fade-in duration-150`}
            >
              {/* Agent Attribution Header */}
              {!isUser && (
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${persona.color.iconBg}`}
                  >
                    {renderAgentIcon(m.agentId)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {m.agentName || persona.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${persona.color.badgeBg} ${persona.color.badgeText} ${persona.color.border}`}
                  >
                    {persona.badge}
                  </span>
                  <span className="text-[10px] text-slate-400">• {m.timestamp}</span>

                  {m.handOffTo && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-medium">
                      <ArrowRight className="w-2.5 h-2.5 text-blue-600" />
                      <span>Handoff to @{AGENT_PERSONAS[m.handOffTo].badge}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                }`}
              >
                {/* Main Message Text (Supports Line Breaks & Formatting) */}
                <div className="whitespace-pre-line font-normal">{m.text}</div>

                {/* Discrepancies Table Card (If included by Verification Engine) */}
                {m.discrepancies && m.discrepancies.length > 0 && (
                  <div className="mt-3 bg-red-50/70 border border-red-200 rounded-xl p-3 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-red-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Confirmed Document Discrepancies ({m.discrepancies.length})
                      </span>
                      <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                        Carrier Action Required
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {m.discrepancies.map((disc, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-red-100 rounded-lg p-2 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{disc.fieldLabel}</div>
                            <div className="text-[11px] text-slate-500">
                              SI: <span className="font-semibold text-emerald-700">{disc.siValue}</span>
                              {" vs "}
                              Draft BL: <span className="font-semibold text-red-700">{disc.blValue}</span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                            MISMATCH
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carrier Amendment Email Draft Card (If generated by Resolution Agent) */}
                {m.emailDraft && (
                  <div className="mt-3 bg-slate-900 text-slate-100 rounded-xl p-3 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                      <div className="flex items-center gap-2">
                        <MailCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white">Generated Carrier Correction Notice</span>
                      </div>
                      <span className="text-[10px] bg-red-900/60 text-red-300 font-bold px-2 py-0.5 rounded border border-red-700/50">
                        Urgency: {m.emailDraft.urgency}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                      <div>
                        <span className="text-slate-500">To:</span> {m.emailDraft.recipient}
                      </div>
                      <div>
                        <span className="text-slate-500">Subject:</span> {m.emailDraft.subject}
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-200 font-mono whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                      {m.emailDraft.body}
                    </div>

                    {/* Email Action Buttons */}
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleCopyEmail(m.emailDraft!.body, m.id)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Copy Amendment Body</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDispatchEmail(m.id)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {dispatchedId === m.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Dispatched to Carrier Desk!</span>
                          </>
                        ) : (
                          <>
                            <SendHorizontal className="w-3.5 h-3.5" />
                            <span>Simulate Carrier Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons emitted by Agent */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="mt-2 space-y-1.5 w-full max-w-[92%] sm:max-w-[85%]">
                  {m.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(act.actionId, act.payload)}
                      className="w-full flex items-center justify-between text-left text-xs bg-white hover:bg-blue-50/80 border border-blue-200 text-blue-700 font-medium px-3 py-2 rounded-xl transition shadow-2xs cursor-pointer group"
                    >
                      <span className="truncate">{act.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-1 transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Multi-Agent Deliberation Indicator */}
        {loading && (
          <div className="flex items-center gap-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <div>
              <div className="font-bold">
                Loading Multi-Agent Workflow...
              </div>

              <div className="text-[11px] text-blue-700">
                Retrieving verified case state and structured orchestration events
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Quick Query Presets Carousel */}
      <div className="px-4 py-2 border-t border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Presets:
          </span>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.prompt)}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Prompt Input & Agent Mentions Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Mention Tag Hint Pill */}
          <div className="relative flex-1">
            <input
              id="multi-agent-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "collaborative"
                  ? "Ask the war room (e.g., 'Investigate SHP-8291' or '@critic is scan legible?')..."
                  : `Ask ${AGENT_PERSONAS[activeAgentId].name}...`
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dispatch</span>
          </button>
        </form>

        {/* Quick Agent Mentions Bar */}
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 overflow-x-auto">
          <span className="font-semibold text-slate-500 shrink-0">Quick Mention:</span>
          {(["orchestrator", "verification", "critic", "revision", "resolution"] as AgentId[]).map((agentKey) => (
            <button
              key={agentKey}
              type="button"
              onClick={() => setInput((prev) => `${prev} @${agentKey} `)}
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 font-mono transition cursor-pointer"
            >
              @{agentKey}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
