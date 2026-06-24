"use client";

import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
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

  const grades = useMemo(
    () => (spec ? listGradesForStandard(spec) : []),
    [spec],
  );

  const lookup = useMemo(
    () => (grade ? lookupMaterialGroup(grade, spec || undefined) : null),
    [grade, spec],
  );

  const parentGroup =
    lookup?.iso9606Group ??
    (grade === defaultGrade && spec === defaultSpec ? defaultGroup : "");

  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-frost/30 p-4 sm:col-span-2">
      <p className="text-sm font-medium text-onyx">
        Material 2 lookup (CEN ISO/TR 20172)
      </p>
      <p className="mt-0.5 text-xs text-steel">
        Second material for two-material test pieces (e.g. pipe-to-plate fillet,
        branch joints). Leave blank when both sides use the same material. Parent
        group is set automatically from the grade.
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
              onChange={(e) => setGrade(e.target.value)}
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
          <Input
            readOnly
            tabIndex={-1}
            value={parentGroup ? `Group ${parentGroup}` : grade ? "—" : ""}
            placeholder="From grade lookup"
            className="cursor-default bg-frost text-onyx"
          />
        </Field>
      </div>
      {spec ? (
        <input type="hidden" name="material2_specification" value={spec} />
      ) : null}
      {grade && spec && grades.length ? (
        <input type="hidden" name="material2_grade" value={grade} />
      ) : null}
      {parentGroup ? (
        <input type="hidden" name="material2_group" value={parentGroup} />
      ) : null}
    </div>
  );
}
