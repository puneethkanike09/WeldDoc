"use client";

import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { MATERIAL_GROUPS } from "@/lib/iso9606/constants";
import {
  listGradesForStandard,
  listMaterialStandards,
  lookupMaterialGroup,
} from "@/lib/materials/tr20172";
import { useMemo, useState } from "react";

interface Material2LookupProps {
  defaultSpec?: string;
  defaultGrade?: string;
  defaultGroup?: string;
}

export function Material2Lookup({
  defaultSpec = "",
  defaultGrade = "",
  defaultGroup = "",
}: Material2LookupProps) {
  const standards = useMemo(() => listMaterialStandards(), []);
  const [spec, setSpec] = useState(defaultSpec);
  const [grade, setGrade] = useState(defaultGrade);
  const [group, setGroup] = useState(defaultGroup);

  const grades = useMemo(
    () => (spec ? listGradesForStandard(spec) : []),
    [spec],
  );

  const lookup = useMemo(
    () => (grade ? lookupMaterialGroup(grade, spec || undefined) : null),
    [grade, spec],
  );

  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-frost/30 p-4 sm:col-span-2">
      <p className="text-sm font-medium text-onyx">
        Material 2 lookup (CEN ISO/TR 20172)
      </p>
      <p className="mt-0.5 text-xs text-steel">
        Second material for two-material test pieces (e.g. pipe-to-plate fillet,
        branch joints). Leave blank when both sides use the same material.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <Field label="Material standard">
          <Select
            value={spec}
            onChange={(e) => {
              setSpec(e.target.value);
              setGrade("");
            }}
          >
            <option value="">—</option>
            {standards.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Material grade / designation">
          {spec && grades.length ? (
            <Select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                const hit = lookupMaterialGroup(e.target.value, spec);
                if (hit) setGroup(hit.iso9606Group);
              }}
            >
              <option value="">—</option>
              {grades.map((g) => (
                <option key={g.designation} value={g.designation}>
                  {g.designation}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              name="material2_grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Optional"
            />
          )}
        </Field>
        <Field label="Parent material group">
          <Select
            name="material2_group"
            value={group || lookup?.iso9606Group || ""}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">—</option>
            {MATERIAL_GROUPS.map((m) => (
              <option key={m.code} value={m.code}>
                Group {m.code}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {spec ? (
        <input type="hidden" name="material2_specification" value={spec} />
      ) : null}
      {grade && spec && grades.length ? (
        <input type="hidden" name="material2_grade" value={grade} />
      ) : null}
    </div>
  );
}
