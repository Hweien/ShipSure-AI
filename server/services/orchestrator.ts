import type { ShipmentCase } from "../../src/types";

export type AgentId =
  | "orchestrator"
  | "extraction"
  | "verification"
  | "critic"
  | "revision"
  | "resolution"
  | "watchdog";

export type AgentEventStatus =
  | "started"
  | "completed"
  | "requires_review";

export interface AgentEvent {
  id: string;
  caseId: string;
  shipmentReference?: string;

  agent: AgentId;
  action: string;
  status: AgentEventStatus;

  summary: string;

  evidence?: Record<string, unknown>;

  handoffTo?: AgentId;
  handoffReason?: string;

  timestamp: string;
}

function eventId(
  caseId: string,
  index: number
) {
  return `${caseId}-${Date.now()}-${index}`;
}

export function orchestrateCase(
  shipmentCase: ShipmentCase
): AgentEvent[] {
  const events: AgentEvent[] = [];

  const addEvent = (
    event: Omit<
      AgentEvent,
      | "id"
      | "caseId"
      | "shipmentReference"
      | "timestamp"
    >
  ) => {
    events.push({
      id: eventId(
        shipmentCase.id,
        events.length + 1
      ),

      caseId: shipmentCase.id,

      shipmentReference:
        shipmentCase.shipmentReference,

      timestamp:
        new Date().toISOString(),

      ...event,
    });
  };

  // --------------------------------------------------
  // 1. Orchestrator receives processed case
  // --------------------------------------------------

  addEvent({
    agent: "orchestrator",
    action: "inspect_case",
    status: "completed",

    summary:
      `Case classified as ${shipmentCase.category}.`,

    evidence: {
      category:
        shipmentCase.category,

      verificationStatus:
        shipmentCase.verificationStatus,

      reviewReason:
        shipmentCase.reviewReason ?? null,
    },
  });

  // --------------------------------------------------
  // 2. Non-document-comparison emails
  // --------------------------------------------------

  if (
    shipmentCase.category !==
    "BL_COMPARISON"
  ) {
    addEvent({
      agent: "orchestrator",
      action: "route_email",
      status: "completed",

      summary:
        `No SI-vs-BL verification required for ${shipmentCase.category}.`,

      evidence: {
        category:
          shipmentCase.category,
      },
    });

    return events;
  }

  // --------------------------------------------------
  // 3. Existing extraction evidence
  // --------------------------------------------------

  addEvent({
    agent: "extraction",
    action:
      "review_extracted_documents",

    status: "completed",

    summary:
      "Reviewed the SI and BL extraction already produced by the document pipeline.",

    evidence: {
      hasSi:
        Boolean(
          shipmentCase.siData
        ),

      hasBl:
        Boolean(
          shipmentCase.blData
        ),
    },

    handoffTo:
      "verification",

    handoffReason:
      "SI and BL extraction is available for seven-field verification.",
  });

  // --------------------------------------------------
  // 4. Verification agent
  // --------------------------------------------------

  addEvent({
    agent: "verification",
    action:
      "review_verification_result",

    status: "completed",

    summary:
      `Verification result: ${shipmentCase.verificationStatus}.`,

    evidence: {
      status:
        shipmentCase.verificationStatus,

      hasDefect:
        shipmentCase.hasDefect,

      defectFields:
        shipmentCase.defectFields ?? [],

      fieldComparisons:
        shipmentCase.fieldComparisons ?? [],
    },

    handoffTo:
      shipmentCase.verificationStatus ===
      "NEEDS_REVIEW"
        ? "critic"
        : shipmentCase.verificationStatus ===
            "MISMATCH"
          ? "resolution"
          : "orchestrator",

    handoffReason:
      shipmentCase.verificationStatus ===
      "NEEDS_REVIEW"
        ? "Verification could not safely reach a final decision."
        : shipmentCase.verificationStatus ===
            "MISMATCH"
          ? "Confirmed discrepancies require resolution."
          : "All required fields passed verification.",
  });

  // --------------------------------------------------
  // 5. Needs human review
  // --------------------------------------------------

  if (
    shipmentCase.verificationStatus ===
    "NEEDS_REVIEW"
  ) {
    addEvent({
      agent: "critic",

      action:
        "enforce_zero_guess_gate",

      status:
        "requires_review",

      summary:
        "Automatic clearance blocked. Human review is required.",

      evidence: {
        reviewReason:
          shipmentCase.reviewReason ??
          "unknown",

        defectFields:
          shipmentCase.defectFields ??
          [],
      },

      handoffReason:
        "Human verification is required before the case can proceed.",
    });

    return events;
  }

  // --------------------------------------------------
  // 6. Confirmed mismatch
  // --------------------------------------------------

  if (
    shipmentCase.verificationStatus ===
    "MISMATCH"
  ) {
    addEvent({
      agent: "resolution",

      action:
        "prepare_resolution",

      status: "completed",

      summary:
        "Confirmed SI-vs-BL discrepancies are ready for amendment workflow.",

      evidence: {
        defectFields:
          shipmentCase.defectFields ??
          [],

        mismatchCount:
          shipmentCase
            .fieldComparisons
            ?.filter(
              (field: any) =>
                field.status ===
                "MISMATCH"
            ).length ?? 0,
      },
    });

    return events;
  }

  // --------------------------------------------------
  // 7. Clean case
  // --------------------------------------------------

  addEvent({
    agent: "orchestrator",

    action:
      "close_verification",

    status: "completed",

    summary:
      "No discrepancy or reliability issue requires further intervention.",

    evidence: {
      status:
        shipmentCase.verificationStatus,
    },
  });

  return events;
}