import type { OperatorQualification, OperatorWeldingMode } from "@/types/db";

export interface RangeLine {
  label: string;
  value: string;
}

function yesNoPhrase(
  value: string | null | undefined,
  yesText: string,
  noText: string,
): string | null {
  if (value === "Yes") return yesText;
  if (value === "No") return noText;
  return null;
}

function visualRemotePhrase(value: string | null | undefined): string | null {
  if (value === "Visual Control") return "Only Visual control";
  if (value === "Remote Control") return "Only Remote control";
  return null;
}

function singleMultiPhrase(value: string | null | undefined): string | null {
  if (value === "Single Run") return "Only Single run Technique";
  if (value === "Multi Run") return "Both Single run & Multi Run Technique";
  return null;
}

function orbitalPhrase(value: string | null | undefined): string | null {
  if (value === "Single position") return "Only for Single Position";
  if (value === "Multiple Position") return "Both Single & Multi Position";
  if (value === "NA") return "NA";
  return null;
}

function consumablePhrase(value: string | null | undefined): string | null {
  if (value === "Yes") return "with consumable insert";
  if (value === "No") return "with or without consumable insert";
  if (value === "NA") return "NA";
  return null;
}

function backingPhrase(
  value: string | null | undefined,
  type: string | null | undefined,
): string | null {
  if (value === "Yes") {
    return type ? `with Backing (${type})` : "with Backing";
  }
  if (value === "No") return "with or without Backing";
  return null;
}

export function computeOperatorRange(
  oq: Pick<
    OperatorQualification,
  | "welding_mode"
  | "visual_or_remote_control"
  | "automatic_joint_tracking"
  | "automatic_arc_length_control"
  | "single_multi_run"
  | "orbital_position"
  | "material_backing"
  | "material_backing_type"
  | "consumable_insert"
  >,
): { lines: RangeLine[]; summary: string } {
  const lines: RangeLine[] = [];
  const mode = oq.welding_mode;

  if (mode === "Mechanized") {
    const pairs: Array<[string, string | null]> = [
      ["Control", visualRemotePhrase(oq.visual_or_remote_control)],
      [
        "Joint tracking",
        yesNoPhrase(
          oq.automatic_joint_tracking,
          "With Automatic Joint Tracking",
          "With or Without automatic Joint Tracking",
        ),
      ],
      [
        "Arc length control",
        yesNoPhrase(
          oq.automatic_arc_length_control,
          "With Automatic Arc Length Control",
          "With or Without Automatic Arc Length Control",
        ),
      ],
      ["Run technique", singleMultiPhrase(oq.single_multi_run)],
      ["Orbital position", orbitalPhrase(oq.orbital_position)],
      [
        "Backing",
        backingPhrase(oq.material_backing, oq.material_backing_type),
      ],
      ["Consumable insert", consumablePhrase(oq.consumable_insert)],
    ];
    for (const [label, value] of pairs) {
      if (value) lines.push({ label, value });
    }
  } else if (mode === "Automatic") {
    const run = singleMultiPhrase(oq.single_multi_run);
    if (run) lines.push({ label: "Run technique", value: run });
  }

  const summary = lines.map((l) => l.value).join("; ");
  return { lines, summary };
}

export function hasTestPieceForRange(mode: OperatorWeldingMode | null): boolean {
  return mode === "Mechanized" || mode === "Automatic";
}
