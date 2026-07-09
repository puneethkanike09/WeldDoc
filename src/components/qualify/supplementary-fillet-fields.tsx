"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import {
  FW_POSITIONS,
  POSITION_LABELS,
  WELDING_PROCESSES,
} from "@/lib/iso9606/constants";
import { Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";

interface SupplementaryFilletFieldsProps {
  defaultChecked?: boolean;
  defaultPosition?: string;
  defaultThickness?: number | null;
  defaultChecked2?: boolean;
  defaultPosition2?: string;
  defaultThickness2?: number | null;
  show: boolean;
  /** Processes on the test piece; 2 entries => per-process supplementary blocks. */
  processes?: string[];
  positionError?: string;
  thicknessError?: string;
  positionError2?: string;
  thicknessError2?: string;
}

function processLabel(code: string): string {
  const p = WELDING_PROCESSES.find((x) => x.code === code);
  return p ? `${p.name} — ${p.code}` : code;
}

function FilletDetailFields({
  positionName,
  thicknessName,
  defaultPosition,
  defaultThickness,
  positionError,
  thicknessError,
}: {
  positionName: string;
  thicknessName: string;
  defaultPosition: string;
  defaultThickness?: number | null;
  positionError?: string;
  thicknessError?: string;
}) {
  const invalidBorder = "border-ember ring-1 ring-ember/20";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Supplementary fillet position"
        required
        error={positionError}
        labelAccessory={<Iso9606TablePdfGlobe table="positionFw" />}
      >
        <Select
          name={positionName}
          defaultValue={defaultPosition}
          required
          className={cn(positionError && invalidBorder)}
        >
          {FW_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {POSITION_LABELS[p] ?? p}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Supplementary fillet material thickness (mm)"
        required
        error={thicknessError}
        labelAccessory={<Iso9606TablePdfGlobe table="thicknessFw" />}
      >
        <Input
          type="number"
          step="0.1"
          name={thicknessName}
          defaultValue={defaultThickness ?? ""}
          placeholder="12"
          required
          className={cn(thicknessError && invalidBorder)}
        />
      </Field>
    </div>
  );
}

/** Step 1 — optional supplementary fillet (extends BW qualification to FW). */
export function SupplementaryFilletFields({
  defaultChecked = false,
  defaultPosition = "PB",
  defaultThickness,
  defaultChecked2 = false,
  defaultPosition2 = "PB",
  defaultThickness2,
  show,
  processes = [],
  positionError,
  thicknessError,
  positionError2,
  thicknessError2,
}: SupplementaryFilletFieldsProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [checked2, setChecked2] = useState(defaultChecked2);
  const multiProcess = processes.length > 1;
  const [process1, process2] = processes;

  if (!show) return null;

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-silver bg-frost/40 p-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] text-charcoal">
          {multiProcess
            ? "Supplementary fillet weld tests extend this butt-weld qualification to fillet welds per ISO 9606-1. Enable one or both processes below."
            : "Supplementary fillet weld test completed with this butt-weld qualification (extends approval to fillet welds per ISO 9606-1)."}
        </p>
        <Iso9606TablePdfGlobe table="supplementaryFillet" />
      </div>

      {multiProcess ? (
        <div className="space-y-4">
          <div className="rounded-[10px] border border-silver bg-panel p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="supplementary_fillet"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#f90a08]"
              />
              <span className="text-[14px] font-medium text-onyx">
                Supplementary fillet for process {processLabel(process1)}
              </span>
            </label>
            {checked ? (
              <div className="mt-4">
                <FilletDetailFields
                  positionName="supplementary_fillet_position"
                  thicknessName="supplementary_fillet_thickness_mm"
                  defaultPosition={defaultPosition}
                  defaultThickness={defaultThickness}
                  positionError={positionError}
                  thicknessError={thicknessError}
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-[10px] border border-silver bg-panel p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="supplementary_fillet_2"
                checked={checked2}
                onChange={(e) => setChecked2(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#f90a08]"
              />
              <span className="text-[14px] font-medium text-onyx">
                Supplementary fillet for process {processLabel(process2)}
              </span>
            </label>
            {checked2 ? (
              <div className="mt-4">
                <FilletDetailFields
                  positionName="supplementary_fillet_2_position"
                  thicknessName="supplementary_fillet_2_thickness_mm"
                  defaultPosition={defaultPosition2}
                  defaultThickness={defaultThickness2}
                  positionError={positionError2}
                  thicknessError={thicknessError2}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <label className="flex min-w-0 flex-1 items-start gap-3">
            <input
              type="checkbox"
              name="supplementary_fillet"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#f90a08]"
            />
            <span className="text-[14px] text-charcoal">
              Supplementary fillet weld test completed with this butt-weld
              qualification.
            </span>
          </label>
          {checked ? (
            <FilletDetailFields
              positionName="supplementary_fillet_position"
              thicknessName="supplementary_fillet_thickness_mm"
              defaultPosition={defaultPosition}
              defaultThickness={defaultThickness}
              positionError={positionError}
              thicknessError={thicknessError}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
