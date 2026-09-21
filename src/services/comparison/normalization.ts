import { ComparisonField } from "../../types";


// Normalize text values
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");
}


// Normalize company names
function normalizeCompany(value: string): string {
  return normalizeText(value)
    .replace(/\bsdnbhd\b/g, "")
    .replace(/\blimited\b/g, "")
    .replace(/\bltd\b/g, "")
    .replace(/\bcompany\b/g, "")
    .replace(/\bco\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}


// Normalize port names
function normalizePort(value: string): string {
  return normalizeText(value)
    .replace(/\bport of\b/g, "")
    .replace(/\bport\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}


// Normalize number values
export function normalizeNumber(value: string): number | null {
  const number = parseFloat(
    value
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isNaN(number) ? null : number;
}


// Normalize a field based on its type
export function normalizeField(
  field: ComparisonField,
  value: string
): string | number | null {

  if (
    field === "container_count" ||
    field === "gross_weight_kg"
  ) {
    return normalizeNumber(value);
  }

  if (
    field === "shipper" ||
    field === "consignee" ||
    field === "notify_party"
  ) {
    return normalizeCompany(value);
  }

  if (
    field === "port_of_loading" ||
    field === "port_of_discharge"
  ) {
    return normalizePort(value);
  }

  return normalizeText(value);
}