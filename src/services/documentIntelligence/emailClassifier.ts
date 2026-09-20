import {
  EmailRecord,
  EmailClassificationResult,
} from "../../types";

export async function classifyEmail(
  email: EmailRecord
): Promise<EmailClassificationResult> {
  const response = await fetch("/api/ds1/classify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(email),
  });

  if (!response.ok) {
    throw new Error(
      `Email classification failed: ${response.status}`
    );
  }

  return response.json();
}