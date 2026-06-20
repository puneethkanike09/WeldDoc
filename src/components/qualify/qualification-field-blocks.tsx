"use client";

import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { MATERIAL_GROUPS } from "@/lib/iso9606/constants";
import {
  listGradesForStandard,
  listMaterialStandards,
  lookupMaterialGroup,
} from "@/lib/materials/tr20172";
import { useMemo, useState } from "react";

interface DissimilarMaterialsProps {
  defaultSpec?: string;
  defaultGrade?: string;
  defaultGroup?: string;
}

export function DissimilarMaterials({
  defaultSpec = "",
  defaultGrade = "",
  defaultGroup = "",
}: DissimilarMaterialsProps) {
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
      <p className="text-sm font-medium text-onyx">Material 2 — dissimilar joint (optional)</p>
      <p className="mt-0.5 text-xs text-steel">
        For two-plate tests where metal 1 and metal 2 differ. Leave blank for
        similar-material joints.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <Field label="Standard">
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
        <Field label="Grade">
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
        <Field label="Parent group">
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

export function ProductDimensions({
  wpq,
}: {
  wpq?: {
    dimension_thickness_mm?: number | null;
    dimension_width_mm?: number | null;
    dimension_length_mm?: number | null;
    dimensions?: string | null;
    pipe_od_mm?: number | null;
  } | null;
}) {
  return (
    <div className="sm:col-span-2 space-y-3">
      <p className="text-sm font-medium text-onyx">Product dimensions</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Thickness (mm)" hint="Type — e.g. 12">
          <Input
            type="number"
            step="0.1"
            name="dimension_thickness_mm"
            defaultValue={wpq?.dimension_thickness_mm ?? ""}
            placeholder="12"
            required
          />
        </Field>
        <Field label="Width (mm)">
          <Input
            type="number"
            step="0.1"
            name="dimension_width_mm"
            defaultValue={wpq?.dimension_width_mm ?? ""}
            placeholder="300"
            required
          />
        </Field>
        <Field label="Length (mm)">
          <Input
            type="number"
            step="0.1"
            name="dimension_length_mm"
            defaultValue={wpq?.dimension_length_mm ?? ""}
            placeholder="250"
            required
          />
        </Field>
      </div>
      <Field label="Free-text dimensions (optional)" hint="Overrides grid if filled">
        <Input
          name="dimensions"
          defaultValue={wpq?.dimensions ?? ""}
          placeholder="12mm(T)×300(W)×250(L) or OD×T×L for pipe"
        />
      </Field>
    </div>
  );
}
