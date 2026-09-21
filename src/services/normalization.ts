/**
 * ShipSure AI - Field Normalization Engine
 * Provides robust deterministic normalization for shipping document fields
 * Preserves original text while generating normalized semantic representations
 */

import { ComparisonField } from "../types";

export interface NormalizedFieldResult<T = string | number> {
  original: string;
  normalized: T;
  unit?: string;
  isNormalized: boolean;
}

// Known Port Aliases Map (canonical port name -> recognized variations)
const PORT_ALIASES: Record<string, string[]> = {
  "PORT KLANG": ["PORT KLANG", "PORT KELANG", "PKL", "MYPKG", "PORT KLANG, MALAYSIA", "NORTHPORT KLANG", "WESTPORTS KLANG"],
  "ROTTERDAM": ["ROTTERDAM", "NLRTM", "PORT OF ROTTERDAM", "ROTTERDAM, NETHERLANDS"],
  "SINGAPORE": ["SINGAPORE", "SGSIN", "PORT OF SINGAPORE", "PSA SINGAPORE"],
  "SHANGHAI": ["SHANGHAI", "CNSHA", "PORT OF SHANGHAI", "YANGSHAN SHANGHAI"],
  "HAMBURG": ["HAMBURG", "DEHAM", "PORT OF HAMBURG", "HAMBURG, GERMANY"],
  "LOS ANGELES": ["LOS ANGELES", "USLAX", "PORT OF LOS ANGELES", "LA HARBOR"],
  "BUSAN": ["BUSAN", "PUSAN", "KRPUS", "PORT OF BUSAN"],
  "NINGBO": ["NINGBO", "CNNGB", "NINGBO-ZHOUSHAN", "PORT OF NINGBO"],
  "ANTWERP": ["ANTWERP", "BEANR", "PORT OF ANTWERP", "ANTWERPEN"],
  "JEBEL ALI": ["JEBEL ALI", "AEJEA", "DUBAI JEBEL ALI", "PORT JEBEL ALI"]
};

// Field Header Aliases Map for document parsing
export const FIELD_HEADER_ALIASES: Record<ComparisonField, string[]> = {
  shipper: ["SHIPPER", "EXPORTER", "SHIPPER / EXPORTER", "SHIPPER NAME", "CONSIGNOR", "FROM"],
  consignee: ["CONSIGNEE", "CONSIGNEE NAME", "CONSIGNED TO", "RECEIVER", "BUYER", "DELIVER TO"],
  notify_party: ["NOTIFY PARTY", "NOTIFY ADDRESS", "ALSO NOTIFY", "NOTIFY", "NOTIFY APPLICANT"],
  port_of_loading: ["PORT OF LOADING", "LOAD PORT", "POL", "PORT OF LOAD", "PLACE OF LOADING", "LOADING PORT"],
  port_of_discharge: ["PORT OF DISCHARGE", "DISCHARGE PORT", "POD", "PORT OF DELIVERY", "PLACE OF DELIVERY", "DESTINATION PORT"],
  container_count: ["CONTAINER COUNT", "NO. OF CONTAINERS", "NUMBER OF CONTAINERS", "TOTAL CONTAINERS", "QTY OF CONTAINERS", "CONTAINER(S)", "CONTAINERS"],
  gross_weight_kg: ["GROSS WEIGHT", "GROSS WT", "TOTAL GROSS WEIGHT", "G.W.", "GW (KG)", "GROSS WEIGHT (KG)", "WEIGHT IN KG", "GROSS MASS"]
};

/**
 * Normalizes company / entity name (trim, uppercase, remove corporate suffixes discrepancies)
 */
export function normalizeEntityName(raw: string): NormalizedFieldResult<string> {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return { original: raw, normalized: "", isNormalized: false };
  }

  // Standardize uppercase & whitespace
  let clean = trimmed.toUpperCase().replace(/\s+/g, " ");

  // Standardize common corporate suffixes
  clean = clean
    .replace(/\bLIMITED\b/g, "LTD")
    .replace(/\bCORPORATION\b/g, "CORP")
    .replace(/\bINCORPORATED\b/g, "INC")
    .replace(/\bCOMPANY\b/g, "CO")
    .replace(/\bSDN\.?\s*BHD\.?\b/g, "SDN BHD")
    .replace(/\bPTE\.?\s*LTD\.?\b/g, "PTE LTD")
    .replace(/[.,]/g, "")
    .trim();

  return {
    original: trimmed,
    normalized: clean,
    isNormalized: clean !== trimmed
  };
}

/**
 * Normalizes Port of Loading / Discharge using canonical geographic aliases
 */
export function normalizePort(raw: string): NormalizedFieldResult<string> {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return { original: raw, normalized: "", isNormalized: false };
  }

  const upper = trimmed.toUpperCase().replace(/[.,]/g, "").replace(/\s+/g, " ");

  // Direct check against known canonical names and aliases
  for (const [canonical, aliases] of Object.entries(PORT_ALIASES)) {
    if (upper === canonical) {
      return { original: trimmed, normalized: canonical, isNormalized: canonical !== trimmed };
    }
    for (const alias of aliases) {
      if (upper === alias || upper.includes(alias) || alias.includes(upper)) {
        return { original: trimmed, normalized: canonical, isNormalized: true };
      }
    }
  }

  return {
    original: trimmed,
    normalized: upper,
    isNormalized: upper !== trimmed
  };
}

/**
 * Normalizes container count into an integer number
 * Handles patterns like "3 Containers", "3 x 40HC", "4 CONT"
 */
export function normalizeContainerCount(raw: string | number): NormalizedFieldResult<number> {
  const str = String(raw || "").trim();
  if (!str) {
    return { original: str, normalized: 0, isNormalized: false };
  }

  // Find first digit sequence
  const match = str.match(/(\d+)/);
  const count = match ? parseInt(match[1], 10) : 0;

  return {
    original: str,
    normalized: count,
    isNormalized: str !== String(count)
  };
}

/**
 * Normalizes gross weight to Kilograms (KG)
 * Handles Metric Tons (MT/TONS -> x 1000), Pounds (LBS -> / 2.20462), etc.
 */
export function normalizeGrossWeight(raw: string | number): NormalizedFieldResult<number> {
  const str = String(raw || "").trim();
  if (!str) {
    return { original: str, normalized: 0, unit: "KG", isNormalized: false };
  }

  const upper = str.toUpperCase();
  // Extract numeric part (e.g. "22,500.00" -> 22500)
  const numMatch = upper.match(/([\d,]+(?:\.\d+)?)/);
  if (!numMatch) {
    return { original: str, normalized: 0, unit: "KG", isNormalized: false };
  }

  const numericVal = parseFloat(numMatch[1].replace(/,/g, ""));
  let normalizedKg = numericVal;
  let detectedUnit = "KG";

  if (upper.includes("MT") || upper.includes("TON") || upper.includes("METRIC TON")) {
    normalizedKg = Math.round(numericVal * 1000);
    detectedUnit = "MT";
  } else if (upper.includes("LBS") || upper.includes("POUND")) {
    normalizedKg = Math.round(numericVal * 0.45359237);
    detectedUnit = "LBS";
  } else {
    normalizedKg = Math.round(numericVal);
    detectedUnit = "KG";
  }

  return {
    original: str,
    normalized: normalizedKg,
    unit: detectedUnit,
    isNormalized: str !== `${normalizedKg} KG`
  };
}

/**
 * Normalize a field based on its comparison type
 */
export function normalizeField(
  field: ComparisonField,
  value: string
): string | number | null {
  switch (field) {
    case "shipper":
    case "consignee":
    case "notify_party":
      return normalizeEntityName(value).normalized;

    case "port_of_loading":
    case "port_of_discharge":
      return normalizePort(value).normalized;

    case "container_count":
      return normalizeContainerCount(value).normalized;

    case "gross_weight_kg":
      return normalizeGrossWeight(value).normalized;

    default:
      return value.trim().toUpperCase();
  }
}