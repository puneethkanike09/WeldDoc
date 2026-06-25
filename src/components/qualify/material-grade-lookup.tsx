"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import {
  inferMaterialLookupSource,
  listGradesForStandard,
  listMaterialStandards,
  lookupMaterialGroup,
  MATERIAL_LOOKUP_OPTIONS,
  type MaterialLookupSource,
} from "@/lib/materials/material-lookup";

type MaterialVariant = 1 | 2;

const VARIANT_CONFIG = {
  1: {
    title: "Material 1 lookup",
    description:
      "Choose the material grouping table, then standard and grade — parent material group is set automatically from ISO/TR 15608 and cannot be changed manually.",
    standardName: "material_standard",
    gradeName: "material_grade",
    groupName: "base_material_group",
  },
  2: {
    title: "Material 2 lookup",
    description:
      "Second material on the test piece — choose grouping table, standard and grade. Parent group is set automatically from ISO/TR 15608.",
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

  const [lookupSource, setLookupSource] = useState<MaterialLookupSource | "">(
    () => inferMaterialLookupSource(defaultStandard),
  );
  const [standard, setStandard] = useState(defaultStandard);
  const [grade, setGrade] = useState(defaultGrade);

  const standards = useMemo(
    () => (lookupSource ? listMaterialStandards(lookupSource) : []),
    [lookupSource],
  );

  const grades = useMemo(
    () =>
      lookupSource && standard
        ? listGradesForStandard(lookupSource, standard)
        : [],
    [lookupSource, standard],
  );

  const lookup = useMemo(
    () =>
      grade && lookupSource
        ? lookupMaterialGroup(grade, standard || undefined, lookupSource)
        : null,
    [grade, standard, lookupSource],
  );

  const parentGroup =
    lookup?.iso9606Group ??
    (grade &&
    standard &&
    lookupSource &&
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
  const lookupHint = MATERIAL_LOOKUP_OPTIONS.find(
    (o) => o.value === lookupSource,
  )?.hint;

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
        <Field label="Material grouping table" required>
          <Select
            value={lookupSource}
            onChange={(e) => {
              const next = e.target.value as MaterialLookupSource | "";
              setLookupSource(next);
              setStandard("");
              setGrade("");
              touch(config.standardName, config.gradeName, config.groupName);
            }}
          >
            <option value="">Select table…</option>
            {MATERIAL_LOOKUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {lookupHint ? (
            <p className="mt-1 text-xs text-steel">{lookupHint}</p>
          ) : null}
        </Field>

        <Field label="Material standard" required error={standardError}>
          <Select
            value={standard}
            disabled={!lookupSource}
            onChange={(e) => {
              setStandard(e.target.value);
              setGrade("");
              touch(config.standardName, config.gradeName, config.groupName);
            }}
            className={cn(standardError && invalidBorder)}
          >
            <option value="">
              {lookupSource ? "Select standard…" : "Select grouping table first…"}
            </option>
            {standards.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Material grade / designation" required error={gradeError}>
          {lookupSource && standard && grades.length > 0 ? (
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
                <option key={g.designation} value={g.designation}>
                  {g.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={grade}
              disabled={!lookupSource || !standard}
              onChange={(e) => {
                setGrade(e.target.value);
                touch(config.gradeName, config.groupName);
              }}
              placeholder={
                !lookupSource
                  ? "Select grouping table first…"
                  : !standard
                    ? "Select standard first…"
                    : lookupSource === "TR20172"
                      ? "S355J2, P265GH, E355…"
                      : "A/SA 36, API 5L X52…"
              }
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
          {lookup.source === "TR20172" ? "TR 20172" : "TR 20173"}
          {" · ISO/TR 15608 group "}
          <span className="font-medium">{lookup.trGroup}</span>
          {" → "}
          ISO 9606-1 parent group{" "}
          <span className="font-medium">{lookup.iso9606Group}</span>
          {lookup.source === "TR20172" &&
          "number" in lookup.material &&
          lookup.material.number ? (
            <>
              {" · "}
              {lookup.material.number}
            </>
          ) : null}
        </p>
      ) : grade && lookupSource ? (
        <p className="text-xs text-steel">
          No match in {lookupSource === "TR20172" ? "TR 20172" : "TR 20173"} —
          choose from the list or check the designation.
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
