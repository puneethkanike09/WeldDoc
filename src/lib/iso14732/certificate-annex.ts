import type {
  OperatorQualification,
  OperatorRevalidationMethod,
} from "@/types/db";
import { TESTING_STANDARD } from "@/lib/iso14732/constants";

export interface CertTableRow {
  date: string;
  signature: string;
  position: string;
}

export interface AnnexCVariableRow {
  label: string;
  test: string;
  range: string;
  sectionHeader?: string;
}

function fmt(d: string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d.includes("T") ? d : `${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function testingStandardLabel(): string {
  return TESTING_STANDARD;
}

export function technologyKnowledgeLabel(
  value: OperatorQualification["welding_technology_knowledge"],
): string {
  if (value === "Acceptable") return "Acceptable";
  if (value === "Not_Acceptable") return "Not acceptable";
  return "Not tested";
}

export function validityLabel(oq: OperatorQualification): string {
  if (oq.revalidation_method === "6.3c") {
    return "While confirmed per 6.2";
  }
  return fmt(oq.expiry_date) || "—";
}

export function revalidationCellValue(
  method: OperatorRevalidationMethod,
  oq: OperatorQualification,
): string {
  if (oq.revalidation_method !== method) return "";
  if (method === "6.3c") return "Per 6.2";
  return fmt(oq.expiry_date);
}

export function clause4MethodChecks(oq: OperatorQualification) {
  const method = oq.qualification_test_method;
  return {
    fusion1: method === "Method_1",
    fusion2: method === "Method_2",
    fusion3: method === "Method_3",
    fusion4: method === "Method_4",
    resistance: oq.welding_type === "Resistance",
    arcStud: false,
  };
}

export function emptySignatureRows(count: number): CertTableRow[] {
  return Array.from({ length: count }, () => ({
    date: "",
    signature: "",
    position: "",
  }));
}
