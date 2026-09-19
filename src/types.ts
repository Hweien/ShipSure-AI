/**
 * ShipSure AI - Domain Types & Interfaces
 * Authoritative types aligned with SDOC Hackathon specification
 */

export type EmailCategory = 
  | "BL_COMPARISON" 
  | "SI_REQUEST" 
  | "INVOICE_QUERY" 
  | "GENERAL" 
  | "SPAM";

export type VerificationStatus = 
  | "OK" 
  | "MISMATCH" 
  | "NEEDS_REVIEW";

export type ReviewReason = 
  | "wrong_doc_type" 
  | "missing_attachment" 
  | "unreadable" 
  | "missing_value";

export type ComparisonField = 
  | "shipper"
  | "consignee"
  | "notify_party"
  | "port_of_loading"
  | "port_of_discharge"
  | "container_count"
  | "gross_weight_kg";

export const COMPARISON_FIELDS: ComparisonField[] = [
  "shipper",
  "consignee",
  "notify_party",
  "port_of_loading",
  "port_of_discharge",
  "container_count",
  "gross_weight_kg"
];

export type FieldMatchStatus = 
  | "EXACT_MATCH" 
  | "NORMALIZED_MATCH" 
  | "MISMATCH" 
  | "NEEDS_REVIEW";

export interface FieldEvidence {
  documentType: "SI" | "BL";
  originalLabel?: string;
  originalValue: string;
  normalizedValue: string | number;
  unit?: string;
  snippet?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface SingleFieldComparison {
  field: ComparisonField;
  label: string;
  siEvidence: FieldEvidence | null;
  blEvidence: FieldEvidence | null;
  status: FieldMatchStatus;
  notes?: string;
}

export interface EmailRecord {
  email_id: string;
  sender?: string;
  from?: string;
  recipient?: string;
  to?: string;
  subject: string;
  date: string;
  body: string;
  attachments: string[];
}

export interface AttachmentContent {
  path: string;
  filename: string;
  fileType: "txt" | "pdf" | "doc" | "xlsx";
  text?: string;
  sizeBytes?: number;
}

export interface ExtractedDocumentFields {
  documentType: "SI" | "BL";
  documentNumber?: string;
  rawText?: string;
  fields: {
    shipper?: { raw: string; normalized: string; snippet?: string };
    consignee?: { raw: string; normalized: string; snippet?: string };
    notify_party?: { raw: string; normalized: string; snippet?: string };
    port_of_loading?: { raw: string; normalized: string; snippet?: string };
    port_of_discharge?: { raw: string; normalized: string; snippet?: string };
    container_count?: { raw: string; normalized: number; snippet?: string };
    gross_weight_kg?: { raw: string; normalized: number; unit?: string; snippet?: string };
  };
  unreadableFields?: string[];
  extractionConfidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  agent: 
    | "Inbox Agent" 
    | "Document Agent" 
    | "Verification Agent" 
    | "Validation Agent" 
    | "Resolution Agent" 
    | "Revision Agent" 
    | "Analytics Agent"
    | "Human Reviewer";
  action: string;
  summary: string;
  status: "success" | "warning" | "error" | "info";
  details?: Record<string, any>;
}

export interface DecisionPassport {
  id: string;
  caseId: string;
  emailId: string;
  agent: string;
  decision: string;
  siValue?: string | number;
  blValue?: string | number;
  evidenceSnippet?: string;
  confidence: string;
  validationStatus: "Confirmed" | "Flagged" | "Overridden";
  humanInterventionRequired: boolean;
  timestamp: string;
}

export interface RevisionComparison {
  caseId: string;
  originalSi: ExtractedDocumentFields;
  blV1: ExtractedDocumentFields;
  blV2: ExtractedDocumentFields;
  correctedFields: {
    field: ComparisonField;
    siValue: any;
    v1Value: any;
    v2Value: any;
    status: "CORRECTED" | "STILL_MISMATCH";
  }[];
  unexpectedChanges: {
    field: ComparisonField;
    siValue: any;
    v1Value: any;
    v2Value: any;
    status: "UNEXPECTED_CHANGE";
    reason: string;
  }[];
  overallOutcome: "RESOLVED" | "NEEDS_HUMAN_REVIEW";
}

export interface ShipmentCase {
  id: string;
  emailId: string;
  shipmentReference: string;
  emailSubject: string;
  receivedDate: string;
  category: EmailCategory;
  verificationStatus: VerificationStatus;
  hasDefect: boolean;
  defectFields: ComparisonField[];
  reviewReason: ReviewReason | null;
  priorityScore: number; // 0 to 100
  priorityReasons: string[];
  fieldComparisons: SingleFieldComparison[];
  siData?: ExtractedDocumentFields;
  blData?: ExtractedDocumentFields;
  blVersion: number;
  hasRevision: boolean;
  revisionComparison?: RevisionComparison;
  humanReviewed: boolean;
  humanReviewDecision?: {
    reviewer: string;
    timestamp: string;
    approvedStatus: VerificationStatus;
    manualOverrides?: Partial<Record<ComparisonField, any>>;
    comments?: string;
  };
  timeline: CaseTimelineEvent[];
  decisions: DecisionPassport[];
  draftResolution?: {
    subject: string;
    recipient: string;
    body: string;
    status: "DRAFT" | "APPROVED";
  };
}

export interface SubmissionEntry {
  category: EmailCategory;
  status: VerificationStatus;
  review_reason: ReviewReason | null;
  defect_fields: string[];
  has_defect: boolean;
}

export type SubmissionJson = Record<string, SubmissionEntry>;

export interface ScoreboardResult {
  final_score?: number;
  stage1_macro_f1?: number;
  stage3_defect_f1?: number;
  end_to_end_accuracy?: number;
  reliability_score?: number;
  total_emails?: number;
  details?: Record<string, any>;
  message?: string;
}

export type DataSourceMode = "DEMO" | "LOCAL" | "DOCKER";

export interface GlobalDateFilter {
  preset: "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM";
  startDate?: string;
  endDate?: string;
}
