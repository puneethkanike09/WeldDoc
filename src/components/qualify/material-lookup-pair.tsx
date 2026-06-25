"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  MaterialGradeLookup,
  type MaterialLookupErrors,
} from "@/components/qualify/material-grade-lookup";
import {
  inferMaterialLookupSource,
  type MaterialLookupSource,
} from "@/lib/materials/material-lookup";
import type { QualificationRecord } from "@/types/db";

export interface MaterialSnapshot {
  lookupSource: MaterialLookupSource | "";
  standard: string;
  grade: string;
  group: string;
}

const LOOKUP_SOURCE_KEYS = {
  1: "material_lookup_source",
  2: "material2_lookup_source",
} as const;

function snapshotFromWpq(
  wpq: QualificationRecord,
  variant: 1 | 2,
): MaterialSnapshot {
  if (variant === 1) {
    return {
      lookupSource: inferMaterialLookupSource(wpq.material_specification ?? ""),
      standard: wpq.material_specification ?? "",
      grade: wpq.material_grade ?? "",
      group: wpq.base_material_group ?? "",
    };
  }
  return {
    lookupSource: inferMaterialLookupSource(wpq.material2_specification ?? ""),
    standard: wpq.material2_specification ?? "",
    grade: wpq.material2_grade ?? "",
    group: wpq.material2_group ?? "",
  };
}

function snapshotFromDraft(
  draft: Record<string, string>,
  variant: 1 | 2,
): MaterialSnapshot {
  const sourceKey = LOOKUP_SOURCE_KEYS[variant];
  const stdKey = variant === 1 ? "material_standard" : "material2_specification";
  const gradeKey = variant === 1 ? "material_grade" : "material2_grade";
  const groupKey = variant === 1 ? "base_material_group" : "material2_group";
  const standard = draft[stdKey] ?? "";
  return {
    lookupSource:
      (draft[sourceKey] as MaterialLookupSource | undefined) ??
      inferMaterialLookupSource(standard),
    standard,
    grade: draft[gradeKey] ?? "",
    group: draft[groupKey] ?? "",
  };
}

/** Material 1 and 2 lookups with copy-to-material-2 action. */
export function MaterialLookupPair({
  wpq,
  draft,
  errors,
  onFieldChange,
}: {
  wpq: QualificationRecord | null;
  draft?: Record<string, string> | null;
  errors?: MaterialLookupErrors;
  onFieldChange?: (key: string) => void;
}) {
  const initial1 = useMemo(
    () =>
      draft
        ? snapshotFromDraft(draft, 1)
        : wpq
          ? snapshotFromWpq(wpq, 1)
          : { lookupSource: "" as const, standard: "", grade: "", group: "" },
    [draft, wpq],
  );
  const initial2 = useMemo(
    () =>
      draft
        ? snapshotFromDraft(draft, 2)
        : wpq
          ? snapshotFromWpq(wpq, 2)
          : { lookupSource: "" as const, standard: "", grade: "", group: "" },
    [draft, wpq],
  );

  const [material1, setMaterial1] = useState<MaterialSnapshot>(initial1);
  const [material2Key, setMaterial2Key] = useState(0);
  const [material2, setMaterial2] = useState<MaterialSnapshot>(initial2);

  const onMaterial1Change = useCallback((values: MaterialSnapshot) => {
    setMaterial1(values);
  }, []);

  const copyMaterial1To2 = useCallback(() => {
    setMaterial2({ ...material1 });
    setMaterial2Key((k) => k + 1);
    onFieldChange?.("material2_specification");
    onFieldChange?.("material2_grade");
    onFieldChange?.("material2_group");
    onFieldChange?.("material2_lookup_source");
  }, [material1, onFieldChange]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start">
      <MaterialGradeLookup
        variant={1}
        defaultStandard={initial1.standard}
        defaultGrade={initial1.grade}
        defaultGroup={initial1.group}
        defaultLookupSource={initial1.lookupSource || undefined}
        errors={errors}
        onFieldChange={onFieldChange}
        onValuesChange={onMaterial1Change}
      />
      <div className="flex justify-center lg:pt-16">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver bg-panel text-steel transition-colors hover:border-onyx/20 hover:bg-frost hover:text-onyx"
          aria-label="Copy Material 1 to Material 2"
          title="Same as Material 1"
          onClick={copyMaterial1To2}
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <MaterialGradeLookup
        key={material2Key}
        variant={2}
        defaultStandard={material2.standard || initial2.standard}
        defaultGrade={material2.grade || initial2.grade}
        defaultGroup={material2.group || initial2.group}
        defaultLookupSource={
          material2.lookupSource || initial2.lookupSource || undefined
        }
        errors={errors}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}
