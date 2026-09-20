import { ShipmentCase } from "../../src/types";

export type BackendAgentId =
  | "orchestrator"
  | "inbox"
  | "document"
  | "verification"
  | "critic"
  | "resolution"
  | "revision"
  | "analytics";

export interface AgentEvent {
  id: string;
  caseId: string;
  agent: BackendAgentId;
  action: string;
  status: "queued" | "running" | "completed" | "needs_review" | "failed";
  summary: string;
  evidence?: Record<string, unknown>;
  timestamp: string;
}

function event(
  caseObj: ShipmentCase,
  agent: BackendAgentId,
  action: string,
  status: AgentEvent["status"],
  summary: string,
  evidence?: Record<string, unknown>,
): AgentEvent {
  return {
    id: `${caseObj.id}-${agent}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    caseId: caseObj.id,
    agent,
    action,
    status,
    summary,
    evidence,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Structured orchestration only. This intentionally records decisions,
 * evidence, and hand-offs rather than hidden chain-of-thought.
 */
export function orchestrateCase(caseObj: ShipmentCase): AgentEvent[] {
  const events: AgentEvent[] = [
    event(
      caseObj,
      "orchestrator",
      "Route case",
      "completed",
      `Routed ${caseObj.shipmentReference} using category ${caseObj.category}.`,
      { category: caseObj.category, priorityScore: caseObj.priorityScore },
    ),
  ];

  if (caseObj.category !== "BL_COMPARISON") {
    events.push(
      event(
        caseObj,
        "inbox",
        "Classification complete",
        "completed",
        "No SI-vs-BL comparison required for this email category.",
      ),
    );
    return events;
  }

  if (caseObj.verificationStatus === "NEEDS_REVIEW") {
    events.push(
      event(
        caseObj,
        "critic",
        "Escalate uncertain case",
        "needs_review",
        "Case cannot be decided reliably and requires human review.",
        { reviewReason: caseObj.reviewReason },
      ),
    );
    return events;
  }

  events.push(
    event(
      caseObj,
      "verification",
      "Verify seven fields",
      "completed",
      caseObj.hasDefect
        ? `Detected ${caseObj.defectFields.length} mismatched field(s).`
        : "No mismatch detected across the compared fields.",
      { defectFields: caseObj.defectFields },
    ),
  );

  if (caseObj.hasRevision && caseObj.revisionComparison) {
    events.push(
      event(
        caseObj,
        "revision",
        "Run 3-way revision check",
        caseObj.revisionComparison.overallOutcome === "RESOLVED"
          ? "completed"
          : "needs_review",
        `Revision check found ${caseObj.revisionComparison.correctedFields.length} correction candidate(s) and ${caseObj.revisionComparison.unexpectedChanges.length} unexpected change(s).`,
        {
          overallOutcome: caseObj.revisionComparison.overallOutcome,
          correctedFields: caseObj.revisionComparison.correctedFields,
          unexpectedChanges: caseObj.revisionComparison.unexpectedChanges,
        },
      ),
    );
  }

  if (caseObj.hasDefect) {
    events.push(
      event(
        caseObj,
        "resolution",
        "Prepare amendment workflow",
        "completed",
        "Discrepancy is ready for human-approved carrier correction drafting.",
        { defectFields: caseObj.defectFields },
      ),
    );
  }

  return events;
}
