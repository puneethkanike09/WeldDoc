import type {
  Operator,
  OperatorQualification,
  OperatorRange,
  Organization,
} from "@/types/db";
import { computeOperatorRange } from "@/lib/iso14732/range-engine";
import type { AnnexCVariableRow } from "@/lib/iso14732/certificate-annex";
import { processLabel } from "@/lib/iso14732/constants";

export interface OperatorCertificateData {
  org: Organization;
  operator: Operator;
  oq: OperatorQualification;
  range: OperatorRange | null;
  certNo: string;
  photoUrl: string | null;
  logoUrl: string | null;
}

function rangePhrase(
  lines: { label: string; value: string }[],
  ...keys: string[]
): string {
  for (const key of keys) {
    const hit = lines.find((l) => l.label === key);
    if (hit) return hit.value;
  }
  return "";
}

export function buildAnnexCVariableRows(
  oq: OperatorQualification,
): AnnexCVariableRow[] {
  const { lines } = computeOperatorRange(oq);
  const rows: AnnexCVariableRow[] = [];

  rows.push({
    label: "",
    test: "",
    range: "",
    sectionHeader: "Common to mechanized/automatic welding",
  });
  rows.push({
    label: "Welding process(es) — (Clause 4)",
    test: processLabel(oq.process),
    range: processLabel(oq.process),
  });
  rows.push({
    label: "Welding equipment — (3.8)",
    test: oq.equipment_power_source ?? "",
    range: oq.equipment_power_source ?? "",
  });
  rows.push({
    label: "Welding unit — (3.7)",
    test: oq.equipment_unit_details ?? "",
    range: oq.equipment_unit_details ?? "",
  });

  if (oq.welding_mode === "Mechanized") {
    rows.push({
      label: "",
      test: "",
      range: "",
      sectionHeader: "Mechanized welding — (5.1)",
    });
    rows.push({
      label: "Visual control/remote visual control",
      test: oq.visual_or_remote_control ?? "",
      range:
        rangePhrase(lines, "Control") ||
        (oq.visual_or_remote_control === "Visual Control"
          ? "Only Visual control"
          : oq.visual_or_remote_control === "Remote Control"
            ? "Only Remote control"
            : ""),
    });
    rows.push({
      label: "Automatic joint tracking",
      test: oq.automatic_joint_tracking ?? "",
      range: rangePhrase(lines, "Joint tracking"),
    });
    rows.push({
      label: "Automatic arc length control",
      test: oq.automatic_arc_length_control ?? "",
      range: rangePhrase(lines, "Arc length control"),
    });
    rows.push({
      label: "Single run/multi run technique",
      test: oq.single_multi_run ?? "",
      range: rangePhrase(lines, "Run technique"),
    });
    rows.push({
      label: "Orbital welding position (single/multiple)",
      test: oq.orbital_position ?? "",
      range: rangePhrase(lines, "Orbital position"),
    });
    rows.push({
      label: "Material backing",
      test:
        oq.material_backing === "Yes" && oq.material_backing_type
          ? `${oq.material_backing} (${oq.material_backing_type})`
          : (oq.material_backing ?? ""),
      range: rangePhrase(lines, "Backing"),
    });
    rows.push({
      label: "Consumable insert",
      test: oq.consumable_insert ?? "",
      range: rangePhrase(lines, "Consumable insert"),
    });
  }

  if (oq.welding_mode === "Automatic") {
    rows.push({
      label: "",
      test: "",
      range: "",
      sectionHeader: "Automatic welding — (5.2)",
    });
    rows.push({
      label: "Single run/multi run technique",
      test: oq.single_multi_run ?? "",
      range: rangePhrase(lines, "Run technique"),
    });
  }

  return rows;
}
