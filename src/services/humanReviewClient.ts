import {
  ComparisonField,
  ShipmentCase,
  VerificationStatus,
} from "../types";

export interface HumanReviewRequest {
  reviewer: string;

  approvedStatus:
    | "OK"
    | "MISMATCH";

  comments?: string;

  manualOverride?: {
    field: ComparisonField;

    documentType:
      | "SI"
      | "BL";

    value: string;
  };
}

export interface HumanReviewResponse {
  success: boolean;

  case: ShipmentCase;

  reverification?: {
    status:
      VerificationStatus;

    hasDefect: boolean;

    defectFields:
      ComparisonField[];

    explanation: string;
  } | null;
}

export async function submitHumanReview(
  caseId: string,
  request: HumanReviewRequest
): Promise<HumanReviewResponse> {
  const response =
    await fetch(
      `/api/cases/${encodeURIComponent(
        caseId
      )}/review`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            request
          ),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Human review failed."
    );
  }

  return data;
}