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
  process2: string | null;
  /** Primary DB joint: BW or FW */
  jointType: "BW" | "FW";
  /** Client joint mode including BW/FW */
  jointMode: "BW" | "FW" | "BW_FW";
  position: string;
  position2: string | null;
  baseMaterialGroup: string;
  fillerGroup: string | null;
  testThicknessMm: number;
  depositedThicknessMm: number | null;
  process2DepositedThicknessMm: number | null;
  pipeOdMm: number | null;
  product: ProductType;
  testingStandard: string;
  dateOfWelding: string;
  expiryDate: string;
  revalidationMethod: RevalidationMethod;
  continuityLastVerified: string | null;
  continuityHistory: string[];
  revalidationHistory: string[];
  supplementaryFillet: boolean;
  supplementaryFilletPosition: string | null;
  supplementaryFilletThicknessMm: number | null;
  supplementaryFillet2: boolean;
  supplementaryFillet2Position: string | null;
  supplementaryFillet2ThicknessMm: number | null;
  resultVt: TestResult;
  resultRtUt: TestResult;
  resultFracture: TestResult;
  wpqStatus: WpqStatus;
}

export interface ValidatedImportRow {
  excelRow: number;
  welder: WelderImportFields;
  qualification: QualificationImportFields | null;
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
  existingWelderCount: number;
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
