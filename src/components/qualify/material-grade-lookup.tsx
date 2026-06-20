"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import {
  listGradesForStandard,
  listMaterialStandards,
  lookupMaterialGroup,
} from "@/lib/materials/tr20172";

interface MaterialGradeLookupProps {
  defaultStandard?: string;
  defaultGrade?: string;
  defaultGroup?: string;
  errors?: {
    material_standard?: string;
    material_grade?: string;
    base_material_group?: string;
  };
  onFieldChange?: (key: string) => void;
}

export function MaterialGradeLookup({
  defaultStandard = "",
  defaultGrade = "",
  defaultGroup = "1",
  errors,
  onFieldChange,
}: MaterialGradeLookupProps) {
  const standards = useMemo(() => listMaterialStandards(), []);
  const [standard, setStandard] = useState(defaultStandard);
  const [grade, setGrade] = useState(defaultGrade);
  const [groupOverride, setGroupOverride] = useState(defaultGroup);
  const [manualGroup, setManualGroup] = useState(false);

  const grades = useMemo(
    () => (standard ? listGradesForStandard(standard) : []),
    [standard],
  );

  const lookup = useMemo(
    () => (grade ? lookupMaterialGroup(grade, standard || undefined) : null),
    [grade, standard],
  );

  const resolvedGroup = manualGroup
    ? groupOverride
    : (lookup?.iso9606Group ?? groupOverride);

  const invalidBorder = "border-ember ring-1 ring-ember/20";

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-silver bg-frost/40 p-4">
      <div>
        <p className="text-sm font-medium text-onyx">Material lookup (CEN ISO/TR 20172)</p>
        <p className="mt-0.5 text-xs text-steel">
          Select the EN standard and grade to auto-fill the parent material group.
          Override manually when the grade is not listed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Material standard" required error={errors?.material_standard}>
          <Select
            value={standard}
            onChange={(e) => {
              setStandard(e.target.value);
              setGrade("");
              onFieldChange?.("material_standard");
              onFieldChange?.("material_grade");
            }}
            className={cn(errors?.material_standard && invalidBorder)}
          >
            <option value="">Select standard…</option>
            {standards.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Material grade / designation" required error={errors?.material_grade}>
          {standard && grades.length > 0 ? (
            <Select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setManualGroup(false);
                onFieldChange?.("material_grade");
              }}
              className={cn(errors?.material_grade && invalidBorder)}
            >
              <option value="">Select grade…</option>
              {grades.map((g) => (
                <option key={`${g.designation}-${g.number}`} value={g.designation}>
                  {g.designation} ({g.number}) — Group {g.group}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setManualGroup(false);
                onFieldChange?.("material_grade");
              }}
              placeholder="S355J2, P265GH, E355…"
              className={cn(errors?.material_grade && invalidBorder)}
            />
          )}
        </Field>
      </div>

      {lookup && !manualGroup && (
        <p className="text-xs text-graphite">
          TR 20172 group <span className="font-medium">{lookup.trGroup}</span>
          {" → "}
          ISO 9606-1 parent group{" "}
          <span className="font-medium">{lookup.iso9606Group}</span>
          {" · "}
          {lookup.material.number}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Field
          label="Parent material group"
          className="min-w-[220px] flex-1"
          required
          error={errors?.base_material_group}
        >
          <Select
            name="base_material_group"
            value={resolvedGroup}
            onChange={(e) => {
              setGroupOverride(e.target.value);
              setManualGroup(true);
              onFieldChange?.("base_material_group");
            }}
            className={cn(errors?.base_material_group && invalidBorder)}
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].map((g) => (
              <option key={g} value={g}>
                Group {g}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-xs text-graphite">
          <input
            type="checkbox"
            checked={manualGroup}
            onChange={(e) => setManualGroup(e.target.checked)}
          />
          Manual override
        </label>
      </div>

      <input type="hidden" name="material_grade" value={grade} required />
      <input
        type="hidden"
        name="material_standard"
        value={standard}
        required
      />
    </div>
  );
}
