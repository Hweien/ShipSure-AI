import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw
} from "lucide-react";
import { GlobalDateFilter, ShipmentCase } from "../types";
import { runShipSureCopilot, AgentResponse } from "../services/agents";

interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  agentName?: string;
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; actionId: string; payload?: any }[];
  contextCase?: ShipmentCase;
}

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateFilter: GlobalDateFilter;
  activeCase?: ShipmentCase;
  onExecuteAction: (actionId: string, payload?: any) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
  currentDateFilter,
  activeCase,
  onExecuteAction
}) => {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "init-1",
      sender: "copilot",
      agentName: "ShipSure Copilot (Orchestrator)",
      text: `${getGreeting()}! I am monitoring shipping operations. How can I assist you with today's inbox or discrepancy investigations?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: [
        { label: "Give me an operational briefing", actionId: "BRIEFING" },
        { label: "Why did SHP-8291 fail?", actionId: "INVESTIGATE_CASE", payload: "CASE-8291" },
        { label: "Show revised BL unexpected changes", actionId: "CHECK_REVISION" }
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (userText?: string) => {
    const text = userText || input;
    if (!text.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // First try server-side Gemini via /api/copilot/chat
      let agentRes: AgentResponse;
      try {
        const res = await fetch("/api/copilot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            context: {
              activeCaseId: activeCase?.id,
              activeShipmentRef: activeCase?.shipmentReference,
              dateFilter: currentDateFilter
            }
          })
        });
        const serverData = await res.json();
        if (serverData.text && !serverData.fallback) {
          agentRes = {
            agentName: serverData.agent || "ShipSure Copilot (Gemini)",
            response: serverData.text,
            contextCase: activeCase
          };
        } else {
          // Deterministic multi-agent engine fallback
          agentRes = await runShipSureCopilot(text, currentDateFilter, activeCase?.id);
        }
      } catch {
        agentRes = await runShipSureCopilot(text, currentDateFilter, activeCase?.id);
      }

      const copilotMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        sender: "copilot",
        agentName: agentRes.agentName,
        text: agentRes.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: agentRes.suggestedActions,
        contextCase: agentRes.contextCase
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "copilot",
          agentName: "Orchestrator Agent",
          text: `I encountered an unexpected issue: ${err.message}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Check today's inbox",
    "Show gross-weight mismatches",
    "Why did SHP-8291 fail?",
    "What changed in BL V2?",
    "Cases requiring human review"
  ];

  if (!isOpen) return null;

  return (
    <div
      id="copilot-drawer"
      className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">ShipSure Copilot</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous & explainable assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Context Banner */}
      {activeCase && (
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-900 flex items-center justify-between">
          <div className="truncate">
            <span className="font-semibold">Context:</span> {activeCase.shipmentReference} ({activeCase.verificationStatus})
          </div>
          <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded font-medium">
            Active Case
          </span>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              {!isUser && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {m.agentName || "ShipSure AI"}
                  </span>
                  <span className="text-[10px] text-slate-400">• {m.timestamp}</span>
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-xs"
                    : "bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-xs whitespace-pre-line"
                }`}
              >
                {m.text}
              </div>

              {/* Action Buttons inside message */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="mt-2 space-y-1.5 w-full max-w-[88%]">
                  {m.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => onExecuteAction(act.actionId, act.payload)}
                      className="w-full flex items-center justify-between text-left text-xs bg-white hover:bg-blue-50/80 border border-blue-200 text-blue-700 font-medium px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer group"
                    >
                      <span className="truncate">{act.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Multi-Agent team is analyzing documents & evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Suggested Queries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.slice(0, 3).map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="text-[11px] bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 px-2.5 py-1 rounded-full transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ShipSure (e.g. 'Why did SHP-8291 fail?')..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
