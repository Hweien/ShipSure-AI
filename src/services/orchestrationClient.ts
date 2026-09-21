export interface AgentEvent {
  id: string;
  caseId: string;
  shipmentReference?: string;

  agent: string;
  action: string;

  status:
    | "started"
    | "completed"
    | "requires_review";

  summary: string;

  evidence?: Record<
    string,
    unknown
  >;

  handoffTo?: string;
  handoffReason?: string;

  timestamp: string;
}

export async function runOrchestration(
  caseId: string
): Promise<AgentEvent[]> {
  const response =
    await fetch(
      "/api/orchestration/run",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          caseId,
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Orchestration failed"
    );
  }

  return data.events || [];
}

export async function getAgentEvents(
  caseId?: string
): Promise<AgentEvent[]> {
  const query =
    caseId
      ? `?caseId=${encodeURIComponent(
          caseId
        )}`
      : "";

  const response =
    await fetch(
      `/api/orchestration/events${query}`
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Unable to load agent events"
    );
  }

  return data;
}