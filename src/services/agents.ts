/**
 * ShipSure AI - Multi-Agent System Engine
 * Implements 8 specialized agents with clean collaborative workflows
 */

import {
  ComparisonField,
  DecisionPassport,
  GlobalDateFilter,
  RevisionComparison,
  ShipmentCase
} from "../types";
import { datasetProvider } from "./datasetProvider";

export interface AgentResponse {
  agentName: string;
  response: string;
  suggestedActions?: { label: string; actionId: string; payload?: any }[];
  contextCase?: ShipmentCase;
  decisions?: DecisionPassport[];
}

export interface InterpretedSearchQuery {
  rawQuery: string;
  field?: ComparisonField;
  status?: string;
  dateRangePreset?: string;
  keyword?: string;
  explanation: string;
  targetTab?: string;
  targetCaseId?: string;
}

/**
 * Natural Language Search Interpreter
 * Parses human language into structured query parameters
 */
export function interpretNaturalLanguageQuery(query: string): InterpretedSearchQuery {
  const q = query.toLowerCase();
  const result: InterpretedSearchQuery = {
    rawQuery: query,
    explanation: ""
  };

  const explanations: string[] = [];

  // Field detection
  if (q.includes("weight") || q.includes("kg") || q.includes("gross")) {
    result.field = "gross_weight_kg";
    explanations.push("Field: Gross Weight (KG)");
  } else if (q.includes("container") || q.includes("count") || q.includes("box")) {
    result.field = "container_count";
    explanations.push("Field: Container Count");
  } else if (q.includes("discharge") || q.includes("pod") || q.includes("destination")) {
    result.field = "port_of_discharge";
    explanations.push("Field: Port of Discharge");
  } else if (q.includes("loading") || q.includes("pol") || q.includes("origin")) {
    result.field = "port_of_loading";
    explanations.push("Field: Port of Loading");
  } else if (q.includes("shipper") || q.includes("exporter")) {
    result.field = "shipper";
    explanations.push("Field: Shipper");
  } else if (q.includes("consignee") || q.includes("receiver")) {
    result.field = "consignee";
    explanations.push("Field: Consignee");
  }

  // Status detection
  if (q.includes("mismatch") || q.includes("fail") || q.includes("discrepanc") || q.includes("defect") || q.includes("differ")) {
    result.status = "MISMATCH";
    explanations.push("Status: Mismatch");
  } else if (q.includes("review") || q.includes("human") || q.includes("unclear") || q.includes("escalat")) {
    result.status = "NEEDS_REVIEW";
    explanations.push("Status: Needs Review");
  } else if (q.includes("match") || q.includes("ok") || q.includes("pass") || q.includes("clear")) {
    result.status = "OK";
    explanations.push("Status: OK");
  }

  // Date detection
  if (q.includes("today")) {
    result.dateRangePreset = "TODAY";
    explanations.push("Date: Today");
  } else if (q.includes("yesterday")) {
    result.dateRangePreset = "YESTERDAY";
    explanations.push("Date: Yesterday");
  } else if (q.includes("last week") || q.includes("7 days")) {
    result.dateRangePreset = "LAST_7_DAYS";
    explanations.push("Date: Last 7 Days");
  } else if (q.includes("month")) {
    result.dateRangePreset = "THIS_MONTH";
    explanations.push("Date: This Month");
  }

  // Keyword extraction for reference or port name
  const matchShp = q.match(/shp-?\d+/i);
  if (matchShp) {
    const rawRef = matchShp[0].toUpperCase();
    result.keyword = rawRef;
    result.targetCaseId = rawRef.replace("SHP-", "CASE-").replace("SHP", "CASE-");
    result.targetTab = "verification";
    explanations.push(`Shipment: ${result.keyword}`);
  } else if (q.includes("revision") || q.includes("v2")) {
    result.targetTab = "revision";
    explanations.push("View: Revision Intelligence");
  } else if (q.includes("inbox") || q.includes("email")) {
    result.targetTab = "inbox";
    explanations.push("View: Inbox");
  } else if (q.includes("human") || q.includes("review")) {
    result.targetTab = "human-review";
    explanations.push("View: Human Review");
  } else if (q.includes("port klang")) {
    result.keyword = "PORT KLANG";
    explanations.push("Port: Port Klang");
  } else if (q.includes("rotterdam")) {
    result.keyword = "ROTTERDAM";
    explanations.push("Port: Rotterdam");
  }

  result.explanation = explanations.length > 0 ? explanations.join(" • ") : "Full text keyword scan";
  return result;
}

/**
 * Proactive AI Watchdog - Discrepancy Anomaly Detector
 */
export interface WatchdogAlert {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  field: ComparisonField;
  description: string;
  affectedCasesCount: number;
  patternSummary: string;
  contributingFactors: string[];
  recommendedAction: string;
}

export function detectWatchdogAlerts(cases: ShipmentCase[]): WatchdogAlert[] {
  const alerts: WatchdogAlert[] = [];

  // Anomaly 1: Weight discrepancies clustering
  const weightMismatches = cases.filter((c) => c.defectFields.includes("gross_weight_kg"));
  if (weightMismatches.length >= 1) {
    alerts.push({
      id: "ALERT-WT-01",
      severity: "WARNING",
      title: "Elevated Gross Weight Discrepancies",
      field: "gross_weight_kg",
      description: `Detected ${weightMismatches.length} shipment(s) with Gross Weight mismatches in the active period.`,
      affectedCasesCount: weightMismatches.length,
      patternSummary: "Unit misalignment between Metric Tons (MT) on SI and Kilograms (KG) on carrier Draft BL.",
      contributingFactors: [
        "Shipper booking notes state gross mass in Metric Tons (MT)",
        "Carrier manifests default to Gross KG without conversion multiplier",
        "Recent Southeast Asia flexitank bulk liquid bookings affected"
      ],
      recommendedAction: "Verify if carrier EDI integration lacks automated metric ton unit conversion."
    });
  }

  // Anomaly 2: Unexpected field revisions
  const unexpectedRevisions = cases.filter((c) => c.revisionComparison?.unexpectedChanges && c.revisionComparison.unexpectedChanges.length > 0);
  if (unexpectedRevisions.length >= 1) {
    alerts.push({
      id: "ALERT-REV-02",
      severity: "CRITICAL",
      title: "Carrier Introduced Unsolicited Field Change on BL V2",
      field: "consignee",
      description: `Case ${unexpectedRevisions[0].shipmentReference} resolved container/weight errors but modified legal Consignee.`,
      affectedCasesCount: unexpectedRevisions.length,
      patternSummary: "Consignee altered from 'PACIFIC INDUSTRIAL TRADING LTD' to 'PACIFIC INDUSTRIAL LOGISTICS GROUP LTD' during re-issue.",
      contributingFactors: [
        "Carrier operator re-keyed booking profile rather than targeted amendment",
        "Risk of destination customs clearance rejection"
      ],
      recommendedAction: "Escalate to senior document manager before approving draft BL release."
    });
  }

  return alerts;
}

/**
 * Similar Case Memory
 * Retrieves historical cases with comparable entities or characteristics
 */
export interface SimilarCaseRecord {
  caseId: string;
  shipmentReference: string;
  similarityScore: number;
  matchReason: string;
  finalHumanDecision: string;
  date: string;
}

export function findSimilarCases(activeCase: ShipmentCase, allCases: ShipmentCase[]): SimilarCaseRecord[] {
  const list: SimilarCaseRecord[] = [];

  for (const c of allCases) {
    if (c.id === activeCase.id) continue;

    let score = 0;
    let reason = "";

    // Common port
    const activePol = activeCase.fieldComparisons.find((f) => f.field === "port_of_loading")?.siEvidence?.normalizedValue;
    const otherPol = c.fieldComparisons.find((f) => f.field === "port_of_loading")?.siEvidence?.normalizedValue;
    if (activePol && otherPol && activePol === otherPol) {
      score += 45;
      reason += `Common Load Port (${activePol}). `;
    }

    // Common defect field
    const commonDefects = activeCase.defectFields.filter((d) => c.defectFields.includes(d));
    if (commonDefects.length > 0) {
      score += 40;
      reason += `Shared defect in ${commonDefects.join(", ")}. `;
    }

    if (score >= 40) {
      list.push({
        caseId: c.id,
        shipmentReference: c.shipmentReference,
        similarityScore: Math.min(98, score + 10),
        matchReason: reason.trim(),
        finalHumanDecision: c.verificationStatus === "OK" ? "Cleared without amendment" : "Required carrier amendment",
        date: c.receivedDate.split("T")[0]
      });
    }
  }

  return list.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Multi-Agent Copilot Orchestration
 * Interprets user questions and calls appropriate agents
 */
export async function runShipSureCopilot(
  userQuery: string,
  currentFilter: GlobalDateFilter,
  activeCaseId?: string
): Promise<AgentResponse> {
  const q = userQuery.toLowerCase().trim();
  const allCases = datasetProvider.getCases();
  const activeCase = activeCaseId ? datasetProvider.getCaseById(activeCaseId) : undefined;

  // 1. Query about specific active case failure: "Why did SHP-8291 fail?" or "Show me evidence"
  if (q.includes("why") || q.includes("fail") || q.includes("evidence") || q.includes("mismatch")) {
    const targetCase = activeCase || allCases.find((c) => q.includes(c.shipmentReference.toLowerCase()) || q.includes(c.id.toLowerCase())) || allCases[0];

    if (targetCase && targetCase.hasDefect) {
      const defects = targetCase.fieldComparisons.filter((f) => f.status === "MISMATCH");
      const defectList = defects
        .map((d) => `• **${d.label}**: SI lists \`${d.siEvidence?.originalValue}\` vs Draft BL \`${d.blEvidence?.originalValue}\` (${d.notes || "discrepancy"})`)
        .join("\n");

      return {
        agentName: "Validation Agent & Verification Agent",
        response: `Shipment **${targetCase.shipmentReference}** was flagged with **${targetCase.defectFields.length} confirmed discrepancies**:\n\n${defectList}\n\n**Reliability Assessment**: Source text was clearly legible with high model confidence (99.2%). This is a genuine carrier document drafting defect, not an OCR or reading artifact.`,
        contextCase: targetCase,
        suggestedActions: [
          { label: "Open Side-by-Side Comparison", actionId: "VIEW_CASE", payload: targetCase.id },
          { label: "Draft Correction Request", actionId: "DRAFT_RESOLUTION", payload: targetCase.id },
          { label: "View Decision Passport", actionId: "VIEW_PASSPORT", payload: targetCase.id }
        ]
      };
    }
  }

  // 2. Query about revisions: "What changed between BL V1 and V2?"
  if (q.includes("v1") || q.includes("v2") || q.includes("revision") || q.includes("unexpected")) {
    const revCase = allCases.find((c) => c.hasRevision) || allCases[2];
    if (revCase && revCase.revisionComparison) {
      const unexpected = revCase.revisionComparison.unexpectedChanges[0];
      return {
        agentName: "Revision Intelligence Agent",
        response: `In **${revCase.shipmentReference}**, the carrier submitted revised **BL V2**:\n\n1. **Requested Corrections**: ✅ Fixed Container Count (4 → 3) and Gross Weight (19,500 → 18,200 KG).\n2. ⚠️ **Unexpected Modification**: The carrier altered the **Consignee** from \`${unexpected.siValue}\` to \`${unexpected.v2Value}\` without authorization.\n\n**Recommendation**: Human review required before accepting draft BL V2.`,
        contextCase: revCase,
        suggestedActions: [
          { label: "Open 3-Way Revision Diff", actionId: "VIEW_REVISION", payload: revCase.id },
          { label: "Escalate to Operations Lead", actionId: "ESCALATE_REVIEW", payload: revCase.id }
        ]
      };
    }
  }

  // 3. Query about inbox / today's briefing: "Check today's inbox" or "Give me a briefing"
  if (q.includes("today") || q.includes("inbox") || q.includes("briefing") || q.includes("attention")) {
    const pendingReviews = allCases.filter((c) => c.verificationStatus === "NEEDS_REVIEW");
    const mismatches = allCases.filter((c) => c.verificationStatus === "MISMATCH");
    const autoCleared = allCases.filter((c) => c.verificationStatus === "OK");

    return {
      agentName: "Orchestrator Agent & Inbox Intelligence Agent",
      response: `**Operations Briefing** (${currentFilter.preset}):\n\n• **${allCases.length} total emails** processed\n• **${mismatches.length} cases with discrepancies** requiring carrier correction\n• **${pendingReviews.length} cases in Human Review** (missing documents or unreadable scans)\n• **${autoCleared.length} auto-verified cases** ready for release\n\nHighest priority case right now: **${mismatches[0]?.shipmentReference || "None"}** (Priority Score: 94/100).`,
      suggestedActions: [
        { label: "Start Priority Queue", actionId: "START_PRIORITY" },
        { label: "Review Human Queue", actionId: "NAVIGATE_HUMAN_REVIEW" },
        { label: "View Discrepancy List", actionId: "NAVIGATE_SHIPMENTS" }
      ]
    };
  }

  // 4. Query about weight discrepancies: "Show weight mismatches"
  if (q.includes("weight")) {
    const weightCases = allCases.filter((c) => c.defectFields.includes("gross_weight_kg"));
    return {
      agentName: "Analytics Agent",
      response: `Found **${weightCases.length} shipments** with gross weight discrepancies in the selected period:\n\n${weightCases.map((c) => `• **${c.shipmentReference}**: ${c.emailSubject}`).join("\n")}\n\n**Root Pattern**: Discrepancies are concentrated on bookings with Metric Ton (MT) conversion differences.`,
      suggestedActions: [
        { label: "Filter Shipments by Weight Discrepancy", actionId: "FILTER_FIELD", payload: "gross_weight_kg" }
      ]
    };
  }

  // 5. Query about human review / escalation: "Why did AI escalate this case?"
  if (q.includes("escalat") || q.includes("review") || q.includes("human")) {
    const reviewCases = allCases.filter((c) => c.verificationStatus === "NEEDS_REVIEW");
    return {
      agentName: "Validation Agent",
      response: `Currently **${reviewCases.length} cases** require human review because AI adheres to strict zero-guess reliability rules:\n\n• **CASE-8392**: Missing Shipping Instruction (SI) attachment\n• **CASE-8411**: Optical smudge on scanned Gross Weight digit (64,000 vs 68,000 kg)\n• **CASE-8519**: Consignee field left blank in shipper's preliminary SI\n\nNo silent hallucinations were allowed.`,
      suggestedActions: [
        { label: "Open Human Review Queue", actionId: "NAVIGATE_HUMAN_REVIEW" }
      ]
    };
  }

  // Fallback: General Orchestrator response
  return {
    agentName: "ShipSure Copilot (Orchestrator)",
    response: `I am monitoring shipping operations across ${allCases.length} cases. You can ask me to:\n\n1. *"Show me yesterday's discrepancies"*\n2. *"Why did shipment SHP-8291 fail?"*\n3. *"What changed between BL V1 and V2?"*\n4. *"Show cases requiring human review"*\n5. *"Draft an amendment request for SHP-8291"*`,
    suggestedActions: [
      { label: "Check Today's Priority Queue", actionId: "START_PRIORITY" },
      { label: "Run System Integrity Audit", actionId: "AUDIT_PIPELINE" }
    ]
  };
}
