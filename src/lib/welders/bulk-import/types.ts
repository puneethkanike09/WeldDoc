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
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  idMethod: string | null;
  idNumber: string | null;
  photoFilename: string | null;
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
  continuityLastVerified: string | null;
  continuityHistory: string[];
  revalidationHistory: string[];
  resultVt: TestResult;
  resultRtUt: TestResult;
  resultFracture: TestResult;
  wpqStatus: WpqStatus;
}

export interface ValidatedImportRow {
  excelRow: number;
  welder: WelderImportFields;
  qualification: QualificationImportFields | null;
  /**
   * Normalized copy of the original Excel cells for this row. The preview grid
   * renders from this so the user's data never disappears when a single field
   * fails validation.
   */
  raw: Record<string, string>;
}

export interface ImportValidationError {
  excelRow: number;
  column?: string;
  message: string;
}

export interface ImportWarning {
  excelRow?: number;
  column?: string;
  message: string;
}

export interface ImportValidationSummary {
  totalRows: number;
  welderCount: number;
  /** Welders that already exist in the org (qualifications will be attached). */
  existingWelderCount: number;
  /** Welders that will be newly created. */
  newWelderCount: number;
  qualificationCount: number;
  errorCount: number;
}

export interface ImportValidationResult {
  ok: boolean;
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  warnings: ImportWarning[];
  summary: ImportValidationSummary;
}
