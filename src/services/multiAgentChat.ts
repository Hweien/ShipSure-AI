/**
 * ShipSure AI - Real Multi-Agent Collaboration Service
 *
 * Phase 3F:
 * - Uses real backend orchestration events
 * - Uses real ShipmentCase data
 * - Does NOT fabricate OCR results, carrier risks, or discrepancies
 * - Does NOT call Gemini
 */

import {
  ComparisonField,
  ShipmentCase,
} from "../types";

import {
  AgentEvent,
  runOrchestration,
} from "./orchestrationClient";

// ============================================================
// Agent definitions
// ============================================================

export type AgentId =
  | "orchestrator"
  | "verification"
  | "extraction"
  | "critic"
  | "revision"
  | "resolution"
  | "watchdog";

export interface AgentPersona {
  id: AgentId;
  name: string;
  roleTitle: string;
  badge: string;

  color: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
  };

  description: string;
  avatarIcon: string;
  specialization: string[];
}

export const AGENT_PERSONAS:
  Record<AgentId, AgentPersona> = {
    orchestrator: {
      id: "orchestrator",
      name: "Lead Orchestrator",
      roleTitle:
        "Operations Triage & Multi-Agent Coordinator",
      badge: "Orchestrator",

      color: {
        bg: "bg-blue-50",
        text: "text-blue-900",
        border: "border-blue-200",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-800",
        iconBg: "bg-blue-600",
      },

      description:
        "Coordinates ShipSure case workflow and routes verified case evidence to the appropriate specialist agent.",

      avatarIcon: "Crown",

      specialization: [
        "Workflow Routing",
        "Case Coordination",
        "Task Delegation",
        "Operational Synthesis",
      ],
    },

    verification: {
      id: "verification",
      name: "Verification Engine",
      roleTitle:
        "Deterministic 7-Field Evaluator",
      badge: "Verification",

      color: {
        bg: "bg-emerald-50",
        text: "text-emerald-900",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-800",
        iconBg: "bg-emerald-600",
      },

      description:
        "Reviews the deterministic SI-vs-BL comparison across the seven required shipping fields.",

      avatarIcon: "FileCheck2",

      specialization: [
        "7-Field Verification",
        "Mismatch Detection",
        "Normalized Matching",
        "Evidence Review",
      ],
    },

    extraction: {
      id: "extraction",
      name:
        "Document & Normalizer Agent",

      roleTitle:
        "Document Extraction & Normalization",

      badge: "Extraction",

      color: {
        bg: "bg-violet-50",
        text: "text-violet-900",
        border: "border-violet-200",
        badgeBg: "bg-violet-100",
        badgeText: "text-violet-800",
        iconBg: "bg-violet-600",
      },

      description:
        "Reviews document extraction evidence already produced by the DS1 document-processing pipeline.",

      avatarIcon: "FileCode2",

      specialization: [
        "Document Extraction",
        "Evidence Anchoring",
        "Port Normalization",
        "Weight Normalization",
      ],
    },

    critic: {
      id: "critic",
      name: "Zero-Guess Critic Gate",

      roleTitle:
        "Reliability & Human Review Gate",

      badge: "Critic",

      color: {
        bg: "bg-amber-50",
        text: "text-amber-900",
        border: "border-amber-200",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-800",
        iconBg: "bg-amber-600",
      },

      description:
        "Blocks automatic decisions when required evidence is unreadable, missing, incomplete, or otherwise unsafe to infer.",

      avatarIcon: "ShieldAlert",

      specialization: [
        "Zero-Guess Policy",
        "Missing Evidence",
        "Human Escalation",
        "Reliability Review",
      ],
    },

    revision: {
      id: "revision",
      name:
        "Version Intelligence Agent",

      roleTitle:
        "Experimental Document Version Reconciliation",

      badge: "Future Extension",

      color: {
        bg: "bg-indigo-50",
        text: "text-indigo-900",
        border: "border-indigo-200",
        badgeBg: "bg-indigo-100",
        badgeText: "text-indigo-800",
        iconBg: "bg-indigo-600",
      },

      description:
        "Experimental extension for comparing a revised BL against the original SI and previous BL version. This capability is not used in the official SDOC evaluation.",

      avatarIcon: "GitCompare",

      specialization: [
        "BL Revision",
        "Corrected Fields",
        "Unexpected Changes",
        "Version Reconciliation",
      ],
    },

    resolution: {
      id: "resolution",
      name:
        "Carrier Resolution & Dispatch",

      roleTitle:
        "Discrepancy Resolution Workflow",

      badge: "Resolution",

      color: {
        bg: "bg-rose-50",
        text: "text-rose-900",
        border: "border-rose-200",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-800",
        iconBg: "bg-rose-600",
      },

      description:
        "Routes confirmed discrepancies into the correction and amendment workflow.",

      avatarIcon: "Send",

      specialization: [
        "Discrepancy Resolution",
        "Correction Workflow",
        "Amendment Preparation",
        "Human Approval",
      ],
    },

    watchdog: {
      id: "watchdog",
      name:
        "Proactive Watchdog & Memory",

      roleTitle:
        "Cross-Case Monitoring",

      badge: "Watchdog",

      color: {
        bg: "bg-cyan-50",
        text: "text-cyan-900",
        border: "border-cyan-200",
        badgeBg: "bg-cyan-100",
        badgeText: "text-cyan-800",
        iconBg: "bg-cyan-700",
      },

      description:
        "Reviews cross-case operational patterns when enough verified historical evidence is available.",

      avatarIcon: "Eye",

      specialization: [
        "Pattern Detection",
        "Cross-Case Monitoring",
        "Recurring Defects",
        "Operational Memory",
      ],
    },
  };

// ============================================================
// Chat types
// ============================================================

export interface ChatAction {
  label: string;
  actionId: string;
  payload?: any;
}

export interface DiscrepancyItem {
  field: ComparisonField;
  fieldLabel: string;
  siValue: string | number;
  blValue: string | number;
  status: string;
  note?: string;
}

export interface EmailDraftSnippet {
  recipient: string;
  subject: string;
  body: string;
  carrier: string;

  urgency:
    | "HIGH"
    | "MEDIUM"
    | "CRITICAL";
}

export interface MultiAgentChatMessage {
  id: string;

  sender:
    | "user"
    | "agent";

  agentId?: AgentId;
  agentName?: string;

  text: string;
  timestamp: string;

  handOffTo?: AgentId;
  handOffReason?: string;

  discrepancies?:
    DiscrepancyItem[];

  emailDraft?:
    EmailDraftSnippet;

  suggestedActions?:
    ChatAction[];

  confidenceScore?: number;

  contextCaseId?: string;
  contextShipmentRef?: string;
}

// ============================================================
// Helpers
// ============================================================

function isAgentId(
  value: string
): value is AgentId {
  return [
    "orchestrator",
    "verification",
    "extraction",
    "critic",
    "revision",
    "resolution",
    "watchdog",
  ].includes(value);
}

function formatTime(
  timestamp: string
): string {
  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return timestamp;
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

function formatAction(
  action: string
): string {
  return action
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

// ============================================================
// @agent mention detection
// ============================================================

export function extractMentionedAgent(
  input: string
): AgentId | null {
  const lower =
    input.toLowerCase();

  if (
    lower.includes("@critic") ||
    lower.includes(
      "@zero-guess"
    )
  ) {
    return "critic";
  }

  if (
    lower.includes("@revision") ||
    lower.includes("@diff")
  ) {
    return "revision";
  }

  if (
    lower.includes(
      "@verification"
    ) ||
    lower.includes("@verify")
  ) {
    return "verification";
  }

  if (
    lower.includes(
      "@extraction"
    ) ||
    lower.includes("@extract")
  ) {
    return "extraction";
  }

  if (
    lower.includes(
      "@resolution"
    ) ||
    lower.includes("@amendment")
  ) {
    return "resolution";
  }

  if (
    lower.includes("@watchdog") ||
    lower.includes("@pattern")
  ) {
    return "watchdog";
  }

  if (
    lower.includes(
      "@orchestrator"
    ) ||
    lower.includes("@lead")
  ) {
    return "orchestrator";
  }

  return null;
}

// ============================================================
// Real case reference detection
// ============================================================

export function extractCaseReference(
  input: string,
  allCases: ShipmentCase[]
):
  | ShipmentCase
  | undefined {
  const query =
    input.toUpperCase();

  // Exact case ID /
  // shipment reference /
  // email ID
  const exact =
    allCases.find(
      (caseObj) =>
        query.includes(
          caseObj.id.toUpperCase()
        ) ||
        query.includes(
          caseObj
            .shipmentReference
            .toUpperCase()
        ) ||
        query.includes(
          caseObj.emailId.toUpperCase()
        )
    );

  if (exact) {
    return exact;
  }

  return undefined;
}

// ============================================================
// Build discrepancy cards from REAL DS2 comparison
// ============================================================

function buildDiscrepancies(
  caseObj: ShipmentCase
): DiscrepancyItem[] {
  return (
    caseObj.fieldComparisons || []
  )
    .filter(
      (comparison) =>
        comparison.status ===
        "MISMATCH"
    )
    .map(
      (comparison) => ({
        field:
          comparison.field,

        fieldLabel:
          comparison.label,

        siValue:
          comparison
            .siEvidence
            ?.originalValue ??
          "Missing",

        blValue:
          comparison
            .blEvidence
            ?.originalValue ??
          "Missing",

        status: "MISMATCH",

        note:
          comparison.notes,
      })
    );
}

// ============================================================
// Dynamic real actions
// ============================================================

function buildActions(
  caseObj: ShipmentCase
): ChatAction[] {
  const actions:
    ChatAction[] = [
      {
        label:
          `Inspect ${caseObj.shipmentReference}`,
        actionId:
          "OPEN_CASE",
        payload:
          caseObj.id,
      },
    ];

  if (
    caseObj.verificationStatus ===
    "NEEDS_REVIEW"
  ) {
    actions.push({
      label:
        "Open Human Review Queue",
      actionId:
        "NAVIGATE_HUMAN_REVIEW",
    });
  }

  if (
    caseObj.verificationStatus ===
    "MISMATCH"
  ) {
    actions.push({
      label:
        "Prepare Resolution Workflow",
      actionId:
        "DRAFT_RESOLUTION",
      payload:
        caseObj.id,
    });
  }

  if (caseObj.hasRevision) {
    actions.push({
      label:
        "View Version Intelligence",
      actionId:
        "NAVIGATE_REVISION",
      payload:
        caseObj.id,
    });
  }

  return actions;
}

// ============================================================
// Convert REAL AgentEvent into chat message
// ============================================================

function eventToChatMessage(
  event: AgentEvent,
  caseObj: ShipmentCase
): MultiAgentChatMessage {
  const agentId:
    AgentId =
    isAgentId(event.agent)
      ? event.agent
      : "orchestrator";

  const persona =
    AGENT_PERSONAS[
      agentId
    ];

  const lines: string[] = [
    event.summary,
    "",
    `Action: ${formatAction(
      event.action
    )}`,
    `Status: ${formatAction(
      event.status
    )}`,
  ];

  if (
    event.handoffReason
  ) {
    lines.push(
      "",
      `Handoff reason: ${event.handoffReason}`
    );
  }

  return {
    id: `chat-${event.id}`,

    sender: "agent",

    agentId,

    agentName:
      persona.name,

    text:
      lines.join("\n"),

    timestamp:
      formatTime(
        event.timestamp
      ),

    handOffTo:
      event.handoffTo &&
      isAgentId(
        event.handoffTo
      )
        ? event.handoffTo
        : undefined,

    handOffReason:
      event.handoffReason,

    discrepancies:
      agentId ===
        "verification" &&
      caseObj
        .verificationStatus ===
        "MISMATCH"
        ? buildDiscrepancies(
            caseObj
          )
        : undefined,

    suggestedActions:
      agentId ===
        "orchestrator" ||
      agentId ===
        "critic" ||
      agentId ===
        "resolution"
        ? buildActions(
            caseObj
          )
        : undefined,

    contextCaseId:
      caseObj.id,

    contextShipmentRef:
      caseObj
        .shipmentReference,
  };
}

// ============================================================
// Direct agent response using REAL case state
// ============================================================

function directAgentResponse(
  agentId: AgentId,
  caseObj: ShipmentCase,
  events: AgentEvent[]
): MultiAgentChatMessage {
  const persona =
    AGENT_PERSONAS[
      agentId
    ];

  const relevantEvent =
    [...events]
      .reverse()
      .find(
        (event) =>
          event.agent ===
          agentId
      );

  let text: string;

  if (relevantEvent) {
    text =
      `${relevantEvent.summary}\n\n` +
      `Action: ${formatAction(
        relevantEvent.action
      )}\n` +
      `Status: ${formatAction(
        relevantEvent.status
      )}`;

    if (
      relevantEvent.handoffReason
    ) {
      text +=
        `\n\nHandoff reason: ${relevantEvent.handoffReason}`;
    }
  } else {
    switch (agentId) {
      case "verification":
        text =
          `Verification status for ${caseObj.shipmentReference}: ` +
          `${caseObj.verificationStatus}.\n\n` +
          `Defect fields: ${
            caseObj
              .defectFields
              ?.length
              ? caseObj
                  .defectFields
                  .join(", ")
              : "None"
          }.`;
        break;

      case "extraction":
        text =
          `Extraction state for ${caseObj.shipmentReference}:\n\n` +
          `SI available: ${Boolean(
            caseObj.siData
          )}\n` +
          `BL available: ${Boolean(
            caseObj.blData
          )}.`;
        break;

      case "critic":
        text =
          caseObj
            .verificationStatus ===
          "NEEDS_REVIEW"
            ? `This case requires human review. Reason: ${
                caseObj.reviewReason ||
                "review required"
              }.`
            : "No critic escalation is recorded for this case.";
        break;

      case "revision":
        text =
          caseObj.hasRevision
            ? `Version Intelligence is available for ${caseObj.shipmentReference}. Revision outcome: ${
                caseObj
                  .revisionComparison
                  ?.overallOutcome ||
                "revision recorded"
              }.`
            : `Version Intelligence is a future extension. No revised BL is linked to ${caseObj.shipmentReference}; the current official workflow uses SI-to-BL verification only.`;

        break;

      case "resolution":
        text =
          caseObj
            .verificationStatus ===
          "MISMATCH"
            ? `Confirmed discrepancies exist in: ${
                caseObj
                  .defectFields
                  .join(", ") ||
                "unspecified fields"
              }. The case is ready for the resolution workflow.`
            : "No confirmed discrepancy currently requires a resolution workflow.";
        break;

      case "watchdog":
        text =
          "No case-specific watchdog event has been recorded yet. Cross-case pattern analysis will be handled by the Watchdog phase.";
        break;

      default:
        text =
          `Case ${caseObj.shipmentReference} is classified as ${caseObj.category} with verification status ${caseObj.verificationStatus}.`;
    }
  }

  return {
    id:
      `direct-${agentId}-${Date.now()}`,

    sender: "agent",

    agentId,

    agentName:
      persona.name,

    text,

    timestamp:
      new Date()
        .toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),

    discrepancies:
      agentId ===
        "verification" &&
      caseObj
        .verificationStatus ===
        "MISMATCH"
        ? buildDiscrepancies(
            caseObj
          )
        : undefined,

    suggestedActions:
      buildActions(
        caseObj
      ),

    contextCaseId:
      caseObj.id,

    contextShipmentRef:
      caseObj
        .shipmentReference,
  };
}

// ============================================================
// REAL MULTI-AGENT COLLABORATION
// ============================================================

export async function runMultiAgentCollaboration(
  userQuery: string,
  selectedCase?: ShipmentCase,
  targetAgentId?: AgentId
): Promise<
  MultiAgentChatMessage[]
> {
  if (!selectedCase) {
    return [
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
          "No processed shipment case is currently selected. Select a case before starting a multi-agent investigation.",

        timestamp:
          new Date()
            .toLocaleTimeString(),
      },
    ];
  }

  const events =
  await runOrchestration(
    selectedCase.id
  );

  // ----------------------------------------------------------
  // Direct 1-on-1 mode
  // ----------------------------------------------------------

  if (
    targetAgentId &&
    targetAgentId !==
      "orchestrator"
  ) {
    return [
      directAgentResponse(
        targetAgentId,
        selectedCase,
        events
      ),
    ];
  }

  // ----------------------------------------------------------
  // Collaborative mode
  // ----------------------------------------------------------

  if (
    events.length === 0
  ) {
    return [
      {
        id:
          `empty-${Date.now()}`,

        sender:
          "agent",

        agentId:
          "orchestrator",

        agentName:
          AGENT_PERSONAS
            .orchestrator
            .name,

        text:
          `No orchestration events are available for ${selectedCase.shipmentReference}.`,

        timestamp:
          new Date()
            .toLocaleTimeString(),
      },
    ];
  }

  return events.map(
    (event) =>
      eventToChatMessage(
        event,
        selectedCase
      )
  );
}