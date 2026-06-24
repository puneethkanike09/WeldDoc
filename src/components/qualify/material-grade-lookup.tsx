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
  title?: string;
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
  title = "Material 1 lookup (CEN ISO/TR 20172)",
  defaultStandard = "",
  defaultGrade = "",
  defaultGroup = "",
  errors,
  onFieldChange,
}: MaterialGradeLookupProps) {
  const standards = useMemo(() => listMaterialStandards(), []);
  const [standard, setStandard] = useState(defaultStandard);
  const [grade, setGrade] = useState(defaultGrade);

  const grades = useMemo(
    () => (standard ? listGradesForStandard(standard) : []),
    [standard],
  );

  const lookup = useMemo(
    () => (grade ? lookupMaterialGroup(grade, standard || undefined) : null),
    [grade, standard],
  );

  const parentGroup =
    lookup?.iso9606Group ??
    (grade === defaultGrade && standard === defaultStandard ? defaultGroup : "");
  const invalidBorder = "border-ember ring-1 ring-ember/20";

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-silver bg-frost/40 p-4">
      <div>
        <p className="text-sm font-medium text-onyx">{title}</p>
        <p className="mt-0.5 text-xs text-steel">
          Select the EN standard and grade — the parent material group is set
          automatically from TR 20172 and cannot be changed manually.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Material standard" required error={errors?.material_standard}>
          <Select
            value={standard}
            onChange={(e) => {
              setStandard(e.target.value);
              setGrade("");
              onFieldChange?.("material_standard");
              onFieldChange?.("material_grade");
              onFieldChange?.("base_material_group");
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
                onFieldChange?.("material_grade");
                onFieldChange?.("base_material_group");
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
                onFieldChange?.("material_grade");
                onFieldChange?.("base_material_group");
              }}
              placeholder="S355J2, P265GH, E355…"
              className={cn(errors?.material_grade && invalidBorder)}
            />
          )}
        </Field>

        <Field label="Parent material group" required error={errors?.base_material_group}>
          <Input
            readOnly
            tabIndex={-1}
            value={
              parentGroup
                ? `Group ${parentGroup}`
                : grade
                  ? "—"
                  : ""
            }
            placeholder="From grade lookup"
            className={cn(
              "cursor-default bg-frost text-onyx",
              errors?.base_material_group && invalidBorder,
            )}
          />
        </Field>
      </div>

      {lookup ? (
        <p className="text-xs text-graphite">
          TR 20172 group <span className="font-medium">{lookup.trGroup}</span>
          {" → "}
          ISO 9606-1 parent group{" "}
          <span className="font-medium">{lookup.iso9606Group}</span>
          {" · "}
          {lookup.material.number}
        </p>
      ) : grade ? (
        <p className="text-xs text-steel">
          No TR 20172 match for this grade — choose from the list or check the
          designation.
        </p>
      ) : null}

      <input type="hidden" name="material_grade" value={grade} required />
      <input type="hidden" name="material_standard" value={standard} required />
      <input type="hidden" name="base_material_group" value={parentGroup} required />
    </div>
  );
}
