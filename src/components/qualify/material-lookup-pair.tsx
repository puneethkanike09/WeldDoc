"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MaterialGradeLookup,
  type MaterialLookupErrors,
} from "@/components/qualify/material-grade-lookup";

interface MaterialLookupPairProps {
  material1: {
    defaultStandard?: string;
    defaultGrade?: string;
    defaultGroup?: string;
  };
  material2: {
    defaultStandard?: string;
    defaultGrade?: string;
    defaultGroup?: string;
  };
  errors?: MaterialLookupErrors;
  onFieldChange?: (key: string) => void;
}

/** Material 1 and 2 lookups with copy-to-material-2 action. */
export function MaterialLookupPair({
  material1,
  material2,
  errors,
  onFieldChange,
}: MaterialLookupPairProps) {
  const [m2Defaults, setM2Defaults] = useState(material2);

  const copyToMaterial2 = () => {
    const form = document.querySelector<HTMLFormElement>(
      "form[data-qualify-step='2']",
    );
    if (!form) return;
    const std =
      form.querySelector<HTMLInputElement>('input[name="material_standard"]')
        ?.value ?? "";
    const grade =
      form.querySelector<HTMLInputElement>('input[name="material_grade"]')
        ?.value ?? "";
    const group =
      form.querySelector<HTMLInputElement>('input[name="base_material_group"]')
        ?.value ?? "";
    setM2Defaults({ defaultStandard: std, defaultGrade: grade, defaultGroup: group });
    onFieldChange?.("material2_specification");
    onFieldChange?.("material2_grade");
    onFieldChange?.("material2_group");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
      <MaterialGradeLookup
        variant={1}
        defaultStandard={material1.defaultStandard}
        defaultGrade={material1.defaultGrade}
        defaultGroup={material1.defaultGroup}
        errors={{
          material_standard: errors?.material_standard,
          material_grade: errors?.material_grade,
          base_material_group: errors?.base_material_group,
        }}
        onFieldChange={onFieldChange}
      />
      <div className="flex justify-center pt-8 lg:pt-16">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Copy Material 1 to Material 2"
          onClick={copyToMaterial2}
        >
          <ArrowRight className="h-4 w-4" />
          Copy
        </Button>
      </div>
      <MaterialGradeLookup
        key={`m2-${m2Defaults.defaultStandard}-${m2Defaults.defaultGrade}`}
        variant={2}
        defaultStandard={m2Defaults.defaultStandard}
        defaultGrade={m2Defaults.defaultGrade}
        defaultGroup={m2Defaults.defaultGroup}
        errors={{
          material2_specification: errors?.material2_specification,
          material2_grade: errors?.material2_grade,
          material2_group: errors?.material2_group,
        }}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}
