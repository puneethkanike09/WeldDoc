import type {
  OperatorQualificationTestMethod,
  OperatorRevalidationMethod,
  OperatorWeldingMode,
  OperatorWeldingType,
  OqStatus,
  TestResult,
} from "@/types/db";

export type RawOperatorImportRow = Record<string, string | number | null>;

export interface OperatorImportFields {
  plantOperatorId: string;
  fullName: string;
  email: string | null;
  dateOfBirth: string;
  placeOfBirth: string;
  idMethod: string;
  idNumber: string;
  operatorStatus: "Active" | "Inactive" | "Suspended";
}

export interface OperatorQualImportFields {
  weldingType: OperatorWeldingType;
  weldingMode: OperatorWeldingMode;
  process: string;
  productType: string;
  jointType: string;
  qualificationTestMethod: OperatorQualificationTestMethod;
  method1Standard: string | null;
  dateOfWelding: string;
  revalidationMethod: OperatorRevalidationMethod;
  examinerName: string | null;
  expiryDate: string | null;
  continuityLastVerified: string;
  ndtResults: Partial<Record<string, TestResult>>;
  oqStatus: OqStatus;
}

export interface ValidatedOperatorImportRow {
  excelRow: number;
  operator: OperatorImportFields;
  qualification: OperatorQualImportFields | null;
}

export interface OperatorImportValidationError {
  excelRow: number;
  column?: string;
  message: string;
}

export interface OperatorImportValidationSummary {
  totalRows: number;
  operatorCount: number;
  qualificationCount: number;
  errorCount: number;
}

export interface OperatorImportValidationResult {
  ok: boolean;
  rows: ValidatedOperatorImportRow[];
  errors: OperatorImportValidationError[];
  summary: OperatorImportValidationSummary;
}
