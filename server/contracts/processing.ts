import {
  EmailCategory,
  ExtractedDocumentFields,
  ReviewReason,
  VerificationStatus,
  ComparisonField,
  SingleFieldComparison
} from "../../src/types";

export interface ProcessingResult {
  emailId: string;

  category: EmailCategory;

  siData?: ExtractedDocumentFields;
  blData?: ExtractedDocumentFields;

  verificationStatus: VerificationStatus;

  hasDefect: boolean;

  defectFields: ComparisonField[];

  reviewReason: ReviewReason | null;

  fieldComparisons: SingleFieldComparison[];
}