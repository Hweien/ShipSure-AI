import { ExtractedDocumentFields } from "../../types";

export async function extractDocumentFields(
  text: string,
  documentType: "SI" | "BL"
): Promise<ExtractedDocumentFields> {
  const response = await fetch("/api/ds1/extract-fields", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      documentType,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Field extraction failed: ${response.status}`
    );
  }

  return response.json();
}