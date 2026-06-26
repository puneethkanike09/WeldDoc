"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { FW_POSITIONS, POSITION_LABELS } from "@/lib/iso9606/constants";
import { Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";

interface SupplementaryFilletFieldsProps {
  defaultChecked?: boolean;
  defaultPosition?: string;
  defaultThickness?: number | null;
  show: boolean;
  positionError?: string;
  thicknessError?: string;
}

/** Step 1 — optional supplementary fillet (extends BW qualification to FW). */
export function SupplementaryFilletFields({
  defaultChecked = false,
  defaultPosition = "PB",
  defaultThickness,
  show,
  positionError,
  thicknessError,
}: SupplementaryFilletFieldsProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const invalidBorder = "border-ember ring-1 ring-ember/20";

  if (!show) return null;

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-silver bg-frost/40 p-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-2">
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
            qualification (extends approval to fillet welds per ISO 9606-1).
          </span>
        </label>
        <Iso9606TablePdfGlobe table="supplementaryFillet" />
      </div>

      {checked ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Supplementary fillet position"
            required
            error={positionError}
            labelAccessory={<Iso9606TablePdfGlobe table="positionFw" />}
          >
            <Select
              name="supplementary_fillet_position"
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
              name="supplementary_fillet_thickness_mm"
              defaultValue={defaultThickness ?? ""}
              placeholder="12"
              required
              className={cn(thicknessError && invalidBorder)}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
