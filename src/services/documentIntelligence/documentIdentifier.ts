import {
  EmailRecord,
  DocumentIdentificationResult,
  ReadDocumentResult,
} from "../../types";

export async function identifyDocuments(
  email: EmailRecord,
  attachmentContents: ReadDocumentResult[] = []
): Promise<DocumentIdentificationResult[]> {
  const response = await fetch("/api/ds1/identify-documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      attachmentContents,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Document identification failed: ${response.status}`
    );
  }

  return response.json();
}