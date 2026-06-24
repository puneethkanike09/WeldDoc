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

type MaterialVariant = 1 | 2;

const VARIANT_CONFIG = {
  1: {
    title: "Material 1 lookup (CEN ISO/TR 20172)",
    description:
      "Select the EN standard and grade — the parent material group is set automatically from TR 20172 and cannot be changed manually.",
    standardName: "material_standard",
    gradeName: "material_grade",
    groupName: "base_material_group",
  },
  2: {
    title: "Material 2 lookup (CEN ISO/TR 20172)",
    description:
      "Second material on the test piece — select the EN standard and grade. The parent material group is set automatically from TR 20172 and cannot be changed manually.",
    standardName: "material2_specification",
    gradeName: "material2_grade",
    groupName: "material2_group",
  },
} as const;

export interface MaterialLookupErrors {
  material_standard?: string;
  material_grade?: string;
  base_material_group?: string;
  material2_specification?: string;
  material2_grade?: string;
  material2_group?: string;
}

interface MaterialGradeLookupProps {
  variant?: MaterialVariant;
  title?: string;
  defaultStandard?: string;
  defaultGrade?: string;
  defaultGroup?: string;
  errors?: MaterialLookupErrors;
  onFieldChange?: (key: string) => void;
}

export function MaterialGradeLookup({
  variant = 1,
  title,
  defaultStandard = "",
  defaultGrade = "",
  defaultGroup = "",
  errors,
  onFieldChange,
}: MaterialGradeLookupProps) {
  const config = VARIANT_CONFIG[variant];
  const displayTitle = title ?? config.title;

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
    (grade &&
    standard &&
    grade === defaultGrade &&
    standard === defaultStandard
      ? defaultGroup
      : "");

  const standardError =
    variant === 1 ? errors?.material_standard : errors?.material2_specification;
  const gradeError =
    variant === 1 ? errors?.material_grade : errors?.material2_grade;
  const groupError =
    variant === 1 ? errors?.base_material_group : errors?.material2_group;

  const invalidBorder = "border-ember ring-1 ring-ember/20";

  const touch = (...keys: string[]) => {
    for (const key of keys) onFieldChange?.(key);
  };

  return (
    <div className="h-full space-y-4 rounded-[var(--radius-card)] border border-silver bg-frost/40 p-4">
      <div>
        <p className="text-sm font-medium text-onyx">{displayTitle}</p>
        <p className="mt-0.5 text-xs text-steel">{config.description}</p>
      </div>

      <div className="grid gap-4">
        <Field label="Material standard" required error={standardError}>
          <Select
            value={standard}
            onChange={(e) => {
              setStandard(e.target.value);
              setGrade("");
              touch(config.standardName, config.gradeName, config.groupName);
            }}
            className={cn(standardError && invalidBorder)}
          >
            <option value="">Select standard…</option>
            {standards.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Material grade / designation" required error={gradeError}>
          {standard && grades.length > 0 ? (
            <Select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                touch(config.gradeName, config.groupName);
              }}
              className={cn(gradeError && invalidBorder)}
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
                touch(config.gradeName, config.groupName);
              }}
              placeholder="S355J2, P265GH, E355…"
              className={cn(gradeError && invalidBorder)}
            />
          )}
        </Field>

        <Field label="Parent material group" required error={groupError}>
          <Input
            readOnly
            tabIndex={-1}
            value={
              parentGroup ? `Group ${parentGroup}` : grade ? "—" : ""
            }
            placeholder="From grade lookup"
            className={cn(
              "cursor-default bg-frost text-onyx",
              groupError && invalidBorder,
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

      <input type="hidden" name={config.gradeName} value={grade} required />
      <input type="hidden" name={config.standardName} value={standard} required />
      <input type="hidden" name={config.groupName} value={parentGroup} required />
    </div>
  );
}

/** @deprecated Use MaterialGradeLookup with variant={2} */
export function Material2Lookup(
  props: Omit<MaterialGradeLookupProps, "variant">,
) {
  return <MaterialGradeLookup variant={2} {...props} />;
}
