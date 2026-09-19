/**
 * ShipSure AI - Multi-Agent Collaborative War Room Service
 * Specialized agents collaborating in real-time to detect, verify, resolve, and audit shipping documents.
 */

import { ComparisonField, ShipmentCase } from "../types";
import { datasetProvider } from "./datasetProvider";

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

export const AGENT_PERSONAS: Record<AgentId, AgentPersona> = {
  orchestrator: {
    id: "orchestrator",
    name: "Lead Orchestrator",
    roleTitle: "Operations Triage & Multi-Agent Coordinator",
    badge: "Orchestrator",
    color: {
      bg: "bg-blue-50",
      text: "text-blue-900",
      border: "border-blue-200",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-800",
      iconBg: "bg-blue-600",
    },
    description: "Evaluates operational queue urgency, routes tasks to domain specialists, and synthesizes overall consensus.",
    avatarIcon: "Crown",
    specialization: ["Email Classification", "Urgency Scoring", "Task Delegation", "Executive Synthesis"]
  },
  verification: {
    id: "verification",
    name: "Verification Engine",
    roleTitle: "Deterministic 7-Field Evaluator",
    badge: "Verification Engine",
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-900",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-800",
      iconBg: "bg-emerald-600",
    },
    description: "Enforces strict mathematical and string verification between SI intended reference and Draft BL candidate.",
    avatarIcon: "FileCheck2",
    specialization: ["7-Field Matching", "Container Count", "Gross Weight (KG)", "Port Discrepancies"]
  },
  extraction: {
    id: "extraction",
    name: "Document & Normalizer Agent",
    roleTitle: "Text Ingestion & Unit Normalizer",
    badge: "Extractor & Normalizer",
    color: {
      bg: "bg-violet-50",
      text: "text-violet-900",
      border: "border-violet-200",
      badgeBg: "bg-violet-100",
      badgeText: "text-violet-800",
      iconBg: "bg-violet-600",
    },
    description: "Extracts verbatim text, standardizes SI Metric Tons (MT) to Kilograms, and resolves UN/LOCODE aliases (PKL -> Port Klang).",
    avatarIcon: "FileCode2",
    specialization: ["MT to KG Normalization", "Port Code Normalization", "Entity Suffix Stripping", "Snippet Anchoring"]
  },
  critic: {
    id: "critic",
    name: "Zero-Guess Critic Gate",
    roleTitle: "Reliability & Anti-Hallucination Gate",
    badge: "Zero-Guess Critic",
    color: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      border: "border-amber-200",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-800",
      iconBg: "bg-amber-600",
    },
    description: "Audits OCR fidelity. Refuses to guess on smudged digits, missing attachments, or blank fields; triggers human review.",
    avatarIcon: "ShieldAlert",
    specialization: ["Optical Smudge Detection", "Missing Attachments", "Zero-Guess Escalation", "Confidence Auditing"]
  },
  revision: {
    id: "revision",
    name: "Revision Intelligence Agent",
    roleTitle: "3-Way Forensic Version Diff Engine",
    badge: "Revision Intelligence",
    color: {
      bg: "bg-indigo-50",
      text: "text-indigo-900",
      border: "border-indigo-200",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-800",
      iconBg: "bg-indigo-600",
    },
    description: "Performs 3-way reconciliation (SI vs BL V1 vs BL V2). Verifies requested fixes while catching unauthorized carrier edits.",
    avatarIcon: "GitCompare",
    specialization: ["BL V1 vs V2 Diff", "Fix Verification", "Unsolicited Carrier Edits", "Legal Entity Shifts"]
  },
  resolution: {
    id: "resolution",
    name: "Carrier Resolution & Dispatch",
    roleTitle: "Discrepancy Remediation & Action Agent",
    badge: "Resolution & Dispatch",
    color: {
      bg: "bg-rose-50",
      text: "text-rose-900",
      border: "border-rose-200",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-800",
      iconBg: "bg-rose-600",
    },
    description: "Composes formal amendment notices, line-item correction citations, and vessel cutoff urgency warnings ready for dispatch.",
    avatarIcon: "Send",
    specialization: ["Carrier Amendment Notices", "Line-Item Citations", "Dispute Resolution", "One-Click Dispatch"]
  },
  watchdog: {
    id: "watchdog",
    name: "Proactive Watchdog & Memory",
    roleTitle: "Institutional Memory & Carrier Habits",
    badge: "Pattern Watchdog",
    color: {
      bg: "bg-cyan-50",
      text: "text-cyan-900",
      border: "border-cyan-200",
      badgeBg: "bg-cyan-100",
      badgeText: "text-cyan-800",
      iconBg: "bg-cyan-700",
    },
    description: "Detects systemic patterns across carrier bookings (e.g. repeated Evergreen weight omissions) and long-term habits.",
    avatarIcon: "Eye",
    specialization: ["Carrier Defect Clustering", "Unit Misalignment Trends", "Cross-Case Memory", "Customs Risk Warnings"]
  }
};

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
  urgency: "HIGH" | "MEDIUM" | "CRITICAL";
}

export interface MultiAgentChatMessage {
  id: string;
  sender: "user" | "agent";
  agentId?: AgentId;
  agentName?: string;
  text: string;
  timestamp: string;
  handOffTo?: AgentId;
  handOffReason?: string;
  discrepancies?: DiscrepancyItem[];
  emailDraft?: EmailDraftSnippet;
  suggestedActions?: ChatAction[];
  confidenceScore?: number;
  contextCaseId?: string;
  contextShipmentRef?: string;
}

/**
 * Parses user input to extract any explicitly mentioned agent (@critic, @revision, etc.)
 */
export function extractMentionedAgent(input: string): AgentId | null {
  const lower = input.toLowerCase();
  if (lower.includes("@critic") || lower.includes("@zero-guess") || lower.includes("@zeroguess")) return "critic";
  if (lower.includes("@revision") || lower.includes("@v2") || lower.includes("@diff")) return "revision";
  if (lower.includes("@verification") || lower.includes("@verify") || lower.includes("@engine")) return "verification";
  if (lower.includes("@extraction") || lower.includes("@normalizer") || lower.includes("@extract")) return "extraction";
  if (lower.includes("@resolution") || lower.includes("@dispatch") || lower.includes("@amendment")) return "resolution";
  if (lower.includes("@watchdog") || lower.includes("@pattern") || lower.includes("@memory")) return "watchdog";
  if (lower.includes("@orchestrator") || lower.includes("@lead")) return "orchestrator";
  return null;
}

/**
 * Extracts target shipment reference or case ID from user text
 */
export function extractCaseReference(input: string, allCases: ShipmentCase[]): ShipmentCase | undefined {
  const match = input.match(/shp-?\d+/i) || input.match(/case-?\d+/i);
  if (match) {
    const raw = match[0].toUpperCase();
    const cleanRef = raw.replace("CASE-", "SHP-").replace("CASE", "SHP-");
    const found = allCases.find(
      (c) => c.shipmentReference === cleanRef || c.id.toUpperCase() === raw || c.shipmentReference.includes(raw)
    );
    if (found) return found;
  }

  // Look for carrier names
  const lower = input.toLowerCase();
  if (lower.includes("evergreen")) {
    return allCases.find((c) => c.emailSubject.toLowerCase().includes("evergreen"));
  }
  if (lower.includes("maersk")) {
    return allCases.find((c) => c.emailSubject.toLowerCase().includes("maersk"));
  }
  if (lower.includes("smudge") || lower.includes("unreadable")) {
    return allCases.find((c) => c.reviewReason === "unreadable");
  }
  if (lower.includes("missing")) {
    return allCases.find((c) => c.reviewReason === "missing_attachment");
  }
  if (lower.includes("v2") || lower.includes("revision")) {
    return allCases.find((c) => c.hasRevision);
  }

  return undefined;
}

/**
 * Executes a collaborative Multi-Agent Investigation Turn
 * Simulates real inter-agent handoffs with authentic case data
 */
export async function runMultiAgentCollaboration(
  userQuery: string,
  selectedCase?: ShipmentCase,
  targetAgentId?: AgentId
): Promise<MultiAgentChatMessage[]> {
  const allCases = datasetProvider.getCases();
  const caseObj = selectedCase || extractCaseReference(userQuery, allCases) || allCases[0];
  const query = userQuery.toLowerCase().trim();
  const messages: MultiAgentChatMessage[] = [];
  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // -------------------------------------------------------------
  // SCENARIO 1: Direct 1-on-1 with a specific agent
  // -------------------------------------------------------------
  if (targetAgentId && targetAgentId !== "orchestrator") {
    return [generateDirectAgentResponse(targetAgentId, query, caseObj, allCases)];
  }

  // -------------------------------------------------------------
  // SCENARIO 2: Optical Ambiguity / Vision Model & OCR Test (e.g. CASE-8411)
  // -------------------------------------------------------------
  if (query.includes("vision") || query.includes("ocr") || query.includes("scan") || query.includes("smudge") || query.includes("unreadable") || query.includes("zero-guess") || (caseObj && caseObj.reviewReason === "unreadable")) {
    // 1. Lead Orchestrator dispatches
    messages.push({
      id: `msg-${Date.now()}-1`,
      sender: "agent",
      agentId: "orchestrator",
      agentName: AGENT_PERSONAS.orchestrator.name,
      text: `Dispatching hard-to-read scan investigation for case **${caseObj.shipmentReference}**. Document is a crooked scan with optical smudges and dense tabular data. Handing off to **Document Vision & Normalizer Agent** to run the Gemini 3.8 Flash Multimodal Vision OCR reader.`,
      timestamp: now(),
      handOffTo: "extraction",
      handOffReason: "Run Multimodal Vision Model, de-skew crooked scan, and parse table",
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference
    });

    // 2. Document Vision Agent runs Multimodal Vision OCR
    messages.push({
      id: `msg-${Date.now()}-2`,
      sender: "agent",
      agentId: "extraction",
      agentName: AGENT_PERSONAS.extraction.name,
      text: `📷 **Gemini 3.8 Flash Vision Model & OCR Pipeline Execution**:\n\n` +
        `• **Orientation Correction**: Auto-deskewed scan by **+7.4° counter-clockwise**.\n` +
        `• **Table Recognition**: Detected multi-row container breakdown table (5 units, 40' High Cube).\n` +
        `• **Unit Normalization**: Standardized weights to standard Metric Kilograms (KG).\n` +
        `• **Optical Ambiguity Alert**: Ink smudge detected on line \`Gross Weight: 6#,000 KG\`. Optical character confidence: Candidate 1 = 64,000 KG (58%), Candidate 2 = 68,000 KG (42%). Handoff to Critic Gate.`,
      timestamp: now(),
      confidenceScore: 0.58,
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference,
      handOffTo: "critic",
      handOffReason: "Enforce zero-guess policy on optical smudge"
    });

    // 3. Critic steps in
    messages.push({
      id: `msg-${Date.now()}-3`,
      sender: "agent",
      agentId: "critic",
      agentName: AGENT_PERSONAS.critic.name,
      text: `🛡️ **Zero-Guess Reliability Gate Enforcement**:\n\n• **Inspected Field**: Gross Weight (KG) on Scanned Bill of Lading\n• **Finding**: Smudge creates 58% vs 42% split. The AI **strictly refuses to guess silently**.\n• **Decision**: Flagged as **NEEDS_REVIEW** with dual candidate values passed to Human Review Queue.`,
      timestamp: now(),
      confidenceScore: 0.58,
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference,
      suggestedActions: [
        { label: "Inspect Optical Source Snippet", actionId: "OPEN_CASE", payload: caseObj.id },
        { label: "Open Human Review Queue", actionId: "NAVIGATE_HUMAN_REVIEW" }
      ]
    });

    return messages;
  }

  // -------------------------------------------------------------
  // SCENARIO 3: 3-Way Revision Diff (BL V1 vs V2 vs SI) (e.g. CASE-7612)
  // -------------------------------------------------------------
  if (query.includes("v2") || query.includes("revision") || query.includes("diff") || query.includes("unexpected") || (caseObj && caseObj.hasRevision)) {
    const revCase = (caseObj && caseObj.hasRevision) ? caseObj : allCases.find((c) => c.hasRevision) || caseObj;
    const revComp = revCase.revisionComparison;

    // 1. Lead Orchestrator
    messages.push({
      id: `msg-${Date.now()}-1`,
      sender: "agent",
      agentId: "orchestrator",
      agentName: AGENT_PERSONAS.orchestrator.name,
      text: `Initiating 3-Way Forensic Reconciliation on **${revCase.shipmentReference}** (Carrier: Maersk Line). Handoff to **Revision Intelligence Agent** to cross-examine SI vs BL V1 vs BL V2.`,
      timestamp: now(),
      handOffTo: "revision",
      handOffReason: "Reconcile requested corrections against unauthorized carrier modifications",
      contextCaseId: revCase.id,
      contextShipmentRef: revCase.shipmentReference
    });

    // 2. Revision Agent
    const unexpected = revComp?.unexpectedChanges[0];
    messages.push({
      id: `msg-${Date.now()}-2`,
      sender: "agent",
      agentId: "revision",
      agentName: AGENT_PERSONAS.revision.name,
      text: `📊 **3-Way Document Version Audit Results**:\n\n` +
        `1. ✅ **Requested Corrections (Resolved)**:\n` +
        `   • Container Count: Corrected from 4 to 3 (Matches SI).\n` +
        `   • Gross Weight: Corrected from 19,500 KG to 18,200 KG (Matches SI).\n\n` +
        `2. 🚨 **CRITICAL DEFECT - Unsolicited Carrier Alteration**:\n` +
        `   • **Field**: Consignee\n` +
        `   • **Original SI**: \`${unexpected?.siValue || "PACIFIC INDUSTRIAL TRADING LTD"}\`\n` +
        `   • **Carrier BL V2**: \`${unexpected?.v2Value || "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD"}\`\n` +
        `   • **Anomaly**: Carrier billing clerk altered the registered legal entity without customer authorization. High risk of customs impoundment at Port of Discharge.`,
      timestamp: now(),
      contextCaseId: revCase.id,
      contextShipmentRef: revCase.shipmentReference,
      handOffTo: "critic",
      handOffReason: "Evaluate customs risk & human sign-off requirement"
    });

    // 3. Critic & Resolution
    messages.push({
      id: `msg-${Date.now()}-3`,
      sender: "agent",
      agentId: "critic",
      agentName: AGENT_PERSONAS.critic.name,
      text: `🛡️ **Zero-Guess Critic Recommendation**: Auto-clear blocked. The unexpected legal entity shift requires mandatory human verification. Flagged with status **NEEDS_HUMAN_REVIEW**.`,
      timestamp: now(),
      contextCaseId: revCase.id,
      contextShipmentRef: revCase.shipmentReference,
      suggestedActions: [
        { label: "Inspect 3-Way Visual Diff Matrix", actionId: "NAVIGATE_REVISION" },
        { label: "Submit to Senior Human Lead", actionId: "NAVIGATE_HUMAN_REVIEW" }
      ]
    });

    return messages;
  }

  // -------------------------------------------------------------
  // SCENARIO 4: Discrepancy Investigation & Carrier Amendment (e.g. SHP-8291)
  // -------------------------------------------------------------
  if (caseObj && (caseObj.verificationStatus === "MISMATCH" || caseObj.hasDefect)) {
    const defects = caseObj.fieldComparisons.filter((f) => f.status === "MISMATCH");
    const defectSummaries: DiscrepancyItem[] = defects.map((d) => ({
      field: d.field,
      fieldLabel: d.label,
      siValue: d.siEvidence?.originalValue || "N/A",
      blValue: d.blEvidence?.originalValue || "N/A",
      status: "MISMATCH",
      note: d.notes
    }));

    // 1. Lead Orchestrator
    messages.push({
      id: `msg-${Date.now()}-1`,
      sender: "agent",
      agentId: "orchestrator",
      agentName: AGENT_PERSONAS.orchestrator.name,
      text: `Convening Multi-Agent War Room for **${caseObj.shipmentReference}** (Priority Score: ${caseObj.priorityScore}/100, Cutoff: In 12 Hours).\nDispatched **Document Normalizer** and **Verification Engine** to inspect documents.`,
      timestamp: now(),
      handOffTo: "extraction",
      handOffReason: "Extract text & normalize metric ton units and port codes",
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference
    });

    // 2. Extraction & Normalizer Agent
    messages.push({
      id: `msg-${Date.now()}-2`,
      sender: "agent",
      agentId: "extraction",
      agentName: AGENT_PERSONAS.extraction.name,
      text: `📄 **Extraction & Normalization Report**:\n\n• **Port of Loading**: Normalized \`PKL (NORTHPORT)\` ➜ UN/LOCODE \`PORT KLANG\`.\n• **Gross Weight Unit**: Shipper SI specified \`22 MT\` ➜ Normalized to \`22,000 KG\` (Metric Ton × 1,000).\n• **Anchors**: Verified exact verbatim match against SI attachment \`SI_SHP8291.txt\` and Carrier Draft \`BL_DRAFT_EVERGREEN.txt\`.`,
      timestamp: now(),
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference,
      handOffTo: "verification",
      handOffReason: "Perform deterministic 7-field rule comparison"
    });

    // 3. Verification Engine
    const lines = defectSummaries.map(
      (d) => `• ❌ **${d.fieldLabel}**: SI specifies \`${d.siValue}\` vs Draft BL \`${d.blValue}\` (${d.note || "Clerical mismatch"})`
    ).join("\n");

    messages.push({
      id: `msg-${Date.now()}-3`,
      sender: "agent",
      agentId: "verification",
      agentName: AGENT_PERSONAS.verification.name,
      text: `🔍 **Verification Engine Findings**:\n\nFlagged **${defectSummaries.length} confirmed discrepancies**:\n${lines}\n\nMathematical evaluation: Container count differs by +1 unit. Gross mass differs by +500 KG. Verified against carrier VGM threshold.`,
      timestamp: now(),
      discrepancies: defectSummaries,
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference,
      handOffTo: "resolution",
      handOffReason: "Generate urgent carrier amendment notice"
    });

    // 4. Resolution Agent with full ready-to-copy email
    const carrierEmail = "docs.my@evergreen-line.com";
    const emailSubject = `URGENT AMENDMENT REQUEST - B/L DRAFT ${caseObj.shipmentReference} - VESSEL CUTOFF 18:00`;
    const emailBody = `Dear Evergreen Documentation Team,\n\nPlease hold issuance of the Original Bill of Lading for reference ${caseObj.shipmentReference}.\nUpon verification against our submitted Shipping Instructions, we identified the following clerical discrepancies on your draft:\n\n1. CONTAINER COUNT: Draft BL reflects 4 x 40'HC containers. Correct count per SI is 3 x 40'HC.\n2. GROSS MASS: Draft BL reflects 22,500.00 KG. Correct gross weight per SI is 22,000.00 KG.\n\nPlease amend the draft and re-issue BL V2 immediately as the shipping order cutoff is today.\n\nBest regards,\nOperations Desk - ShipSure AI`;

    messages.push({
      id: `msg-${Date.now()}-4`,
      sender: "agent",
      agentId: "resolution",
      agentName: AGENT_PERSONAS.resolution.name,
      text: `✉️ **Carrier Amendment Draft Ready**:\n\nFormulated urgent correction notice with line-item citations. You can copy the email directly or jump to the side-by-side verification table below.`,
      timestamp: now(),
      contextCaseId: caseObj.id,
      contextShipmentRef: caseObj.shipmentReference,
      emailDraft: {
        recipient: carrierEmail,
        subject: emailSubject,
        body: emailBody,
        carrier: "Evergreen Line",
        urgency: "CRITICAL"
      },
      suggestedActions: [
        { label: "Open Side-by-Side Comparison", actionId: "OPEN_CASE", payload: caseObj.id },
        { label: "Inspect Decision Passport", actionId: "OPEN_PASSPORT", payload: caseObj.id },
        { label: "Dispatch to Carrier Desk", actionId: "SIMULATE_SEND", payload: caseObj.id }
      ]
    });

    return messages;
  }

  // -------------------------------------------------------------
  // SCENARIO 5: Proactive Watchdog & Carrier Patterns
  // -------------------------------------------------------------
  if (query.includes("pattern") || query.includes("carrier") || query.includes("habit") || query.includes("watchdog")) {
    messages.push({
      id: `msg-${Date.now()}-1`,
      sender: "agent",
      agentId: "watchdog",
      agentName: AGENT_PERSONAS.watchdog.name,
      text: `🐕 **Carrier Defect Pattern & Memory Analysis**:\n\n` +
        `• **Pattern Detected**: 67% of gross weight discrepancies are concentrated in booking drafts originating from **Evergreen Line**.\n` +
        `• **Root Cause**: Carrier documentation clerks frequently overlook SI units declared in **Metric Tons (MT)** and enter tare weight manually.\n` +
        `• **Recommended System Rule**: Mandate automated 1,000x multiplier flag on all draft BLs where Shipper SI contains 'MT' or 'Tons'.`,
      timestamp: now(),
      suggestedActions: [
        { label: "View Watchdog Anomaly Dashboard", actionId: "NAVIGATE_WATCHDOG" },
        { label: "Filter Shipments by Weight Discrepancy", actionId: "FILTER_WEIGHT" }
      ]
    });

    return messages;
  }

  // -------------------------------------------------------------
  // DEFAULT SCENARIO: Operations Briefing & Task Coordination
  // -------------------------------------------------------------
  const mismatches = allCases.filter((c) => c.verificationStatus === "MISMATCH");
  const reviews = allCases.filter((c) => c.verificationStatus === "NEEDS_REVIEW");
  const cleared = allCases.filter((c) => c.verificationStatus === "OK");

  messages.push({
    id: `msg-${Date.now()}-1`,
    sender: "agent",
    agentId: "orchestrator",
    agentName: AGENT_PERSONAS.orchestrator.name,
    text: `📋 **Multi-Agent Operations Status Briefing**:\n\n` +
      `• **Total Processed Shipments**: ${allCases.length}\n` +
      `• **Confirmed Discrepancies**: ${mismatches.length} (Requires carrier amendment)\n` +
      `• **Zero-Guess Review Queue**: ${reviews.length} (Optical smudges or missing documents)\n` +
      `• **Auto-Cleared Green**: ${cleared.length} (Released to port gates)\n\n` +
      `Highest priority right now: **${mismatches[0]?.shipmentReference || "SHP-8291"}** (Vessel cutoff imminent). How would you like the agents to proceed?`,
    timestamp: now(),
    suggestedActions: [
      { label: `Investigate Highest Priority (${mismatches[0]?.shipmentReference || "SHP-8291"})`, actionId: "INVESTIGATE_CASE", payload: mismatches[0]?.id },
      { label: "Review 3-Way Revision Intelligence", actionId: "NAVIGATE_REVISION" },
      { label: "Audit Zero-Guess Review Cases", actionId: "NAVIGATE_HUMAN_REVIEW" }
    ]
  });

  return messages;
}

/**
 * Generates an in-depth direct response from a single specialized agent
 */
function generateDirectAgentResponse(
  agentId: AgentId,
  query: string,
  activeCase: ShipmentCase,
  allCases: ShipmentCase[]
): MultiAgentChatMessage {
  const persona = AGENT_PERSONAS[agentId];
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  switch (agentId) {
    case "verification":
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId,
        agentName: persona.name,
        text: `I am the **Verification Engine**. I evaluate 7 strict fields: Shipper, Consignee, Notify Party, POL, POD, Container Count, and Gross Weight (KG).\n\nFor **${activeCase.shipmentReference}**:\n• Status: **${activeCase.verificationStatus}**\n• Defect Fields: ${activeCase.defectFields.length > 0 ? activeCase.defectFields.join(", ") : "None (All Exact or Normalized Matches)"}.\n• Exact matches: ${activeCase.fieldComparisons.filter(f => f.status === "EXACT_MATCH").length}/7 fields.`,
        timestamp: now,
        suggestedActions: [
          { label: "Inspect Side-by-Side Comparison", actionId: "OPEN_CASE", payload: activeCase.id }
        ]
      };

    case "extraction":
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId,
        agentName: persona.name,
        text: `I am the **Document Extraction & Normalizer Agent**. My responsibility is to preserve verbatim evidence while harmonizing non-standard representations:\n\n• Unit conversions: SI 'MT' ➜ KG (×1,000)\n• Port Aliases: 'PKL' / 'Northport' ➜ 'MYPKG PORT KLANG'\n• Legal Suffixes: 'LTD' / 'LIMITED' normalized for semantic identity while flagging legal entity shifts.\n\nAll extractions cite document character offsets and OCR bounding confidence.`,
        timestamp: now
      };

    case "critic":
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId,
        agentName: persona.name,
        text: `I am the **Zero-Guess Critic Gate**. My mandate is absolute reliability: **never hallucinate or guess**.\n\nIf an attachment is missing, a field is left blank, or a scanned digit is smudged (e.g. CASE-8411 where a 4 could be an 8), I reject probabilistic completion and immediately mandate human sign-off with clear confidence scores.`,
        timestamp: now,
        suggestedActions: [
          { label: "View Human Review Queue", actionId: "NAVIGATE_HUMAN_REVIEW" }
        ]
      };

    case "revision":
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId,
        agentName: persona.name,
        text: `I am the **Revision Intelligence Agent**. When a carrier re-issues a draft (BL V2), I run a 3-way matrix:\n1. Did they fix the requested mistakes?\n2. Did they introduce sneaky, unauthorized alterations?\n\nIn **SHP-7612**, the carrier resolved the container count and gross weight, but unilaterally changed the Consignee company name. This was flagged as **UNEXPECTED_CHANGE**.`,
        timestamp: now,
        suggestedActions: [
          { label: "Open 3-Way Revision Diff", actionId: "NAVIGATE_REVISION" }
        ]
      };

    case "resolution":
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId,
        agentName: persona.name,
        text: `I am the **Carrier Resolution & Dispatch Agent**. I turn discrepancies into legally defensible, carrier-ready amendment emails with exact line-item citations, container numbers, and vessel cutoff countdowns so carriers have zero ambiguity when issuing BL V2.`,
        timestamp: now,
        suggestedActions: [
          { label: `Draft Amendment for ${activeCase.shipmentReference}`, actionId: "DRAFT_AMENDMENT", payload: activeCase.id }
        ]
      };

    case "watchdog":
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId,
        agentName: persona.name,
        text: `I am the **Proactive Watchdog & Long-Term Memory Agent**. I analyze cross-case trends to protect your operations:\n\n• Detected 3 carrier booking desks that repeatedly omit container tare weights.\n• Maintained institutional entity alias memory across 140+ trading partners.\n• Flagged customs risk on Port Klang bookings with terminal code confusion.`,
        timestamp: now,
        suggestedActions: [
          { label: "Inspect Anomaly Dashboard", actionId: "NAVIGATE_WATCHDOG" }
        ]
      };

    default:
      return {
        id: `msg-dir-${Date.now()}`,
        sender: "agent",
        agentId: "orchestrator",
        agentName: persona.name,
        text: `Lead Orchestrator standing by. You can ask me to coordinate all 7 specialized agents on any shipment case or query.`,
        timestamp: now
      };
  }
}
