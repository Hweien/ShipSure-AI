import { ReadDocumentResult } from "../../types";

export async function readDocument(
  path: string
): Promise<ReadDocumentResult> {
  const response = await fetch("/api/ds1/read-document", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    throw new Error(
      `Document reading failed: ${response.status}`
    );
  }

  return response.json();
}