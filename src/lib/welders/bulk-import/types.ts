import type {
  ProductType,
  RevalidationMethod,
  TestResult,
  WelderStatus,
  WpqStatus,
} from "@/types/db";

export type RawImportRow = Record<string, string | number | null>;

export interface WelderImportFields {
  plantWelderId: string;
  fullName: string;
  email: string | null;
  dateOfBirth: string;
  placeOfBirth: string;
  idMethod: string;
  idNumber: string;
  welderStatus: WelderStatus;
}

export interface QualificationImportFields {
  process: string;
  jointType: string;
  position: string;
  baseMaterialGroup: string;
  fillerGroup: string | null;
  testThicknessMm: number;
  depositedThicknessMm: number | null;
  pipeOdMm: number | null;
  product: ProductType;
  testingStandard: string;
  dateOfWelding: string;
  expiryDate: string;
  revalidationMethod: RevalidationMethod;
  continuityLastVerified: string;
  resultVt: TestResult;
  resultRtUt: TestResult;
  resultFracture: TestResult;
  wpqStatus: WpqStatus;
}

export interface ValidatedImportRow {
  excelRow: number;
  welder: WelderImportFields;
  qualification: QualificationImportFields | null;
}

export interface ImportValidationError {
  excelRow: number;
  column?: string;
  message: string;
}

export interface ImportValidationSummary {
  totalRows: number;
  welderCount: number;
  qualificationCount: number;
  errorCount: number;
}

export interface ImportValidationResult {
  ok: boolean;
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  summary: ImportValidationSummary;
}
