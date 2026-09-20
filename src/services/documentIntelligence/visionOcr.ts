export interface VisionOcrResult {
  rawOcrText: string;
  orientationCorrection?: string;
  qualityScore?: number;

  fields: {
    shipper: { raw: string | null; confidence: number; snippet?: string };
    consignee: { raw: string | null; confidence: number; snippet?: string };
    notify_party: { raw: string | null; confidence: number; snippet?: string };
    port_of_loading: { raw: string | null; confidence: number; snippet?: string };
    port_of_discharge: { raw: string | null; confidence: number; snippet?: string };
    container_count: { raw: string | null; confidence: number; snippet?: string };
    gross_weight_kg: { raw: string | null; confidence: number; snippet?: string };
  };

  unreadableFields: string[];
  opticalAmbiguities?: unknown[];
}

export async function runVisionOcr(
  path: string,
  documentType: "SI" | "BL"
): Promise<VisionOcrResult> {
  const response = await fetch("/api/vision/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      docType: documentType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision OCR failed: ${response.status}`);
  }

  const result = await response.json();

  return result.data;
}