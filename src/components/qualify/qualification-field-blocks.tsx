"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import type { JointCategory, ProductType } from "@/types/db";
import { Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";
import {
  fieldName,
  materialDimensionBlocks,
  wpqDimensionValue,
  type DimensionFieldKey,
  type MaterialDimensionBlock,
} from "@/lib/iso9606/product-dimensions";

const FIELD_LABELS: Record<Exclude<DimensionFieldKey, "freeText">, string> = {
  thickness: "Thickness (mm)",
  width: "Width (mm)",
  length: "Length (mm)",
  diameter: "Outside diameter (mm)",
};

type WpqDimensions = {
  dimension_thickness_mm?: number | null;
  dimension_width_mm?: number | null;
  dimension_length_mm?: number | null;
  dimension2_thickness_mm?: number | null;
  dimension2_width_mm?: number | null;
  dimension2_length_mm?: number | null;
  dimension2_pipe_od_mm?: number | null;
  dimensions?: string | null;
  dimensions2?: string | null;
  pipe_od_mm?: number | null;
} | null;

function valuesForBlock(
  wpq: WpqDimensions,
  block: MaterialDimensionBlock,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of block.fields) {
    const name = fieldName(block.material, key);
    out[name] = String(wpqDimensionValue(wpq, block.material, key) ?? "");
  }
  return out;
}

function buildInitialValues(
  wpq: WpqDimensions,
  blocks: MaterialDimensionBlock[],
): { m1: Record<string, string>; m2: Record<string, string> } {
  const m1: Record<string, string> = {};
  const m2: Record<string, string> = {};
  for (const block of blocks) {
    const vals = valuesForBlock(wpq, block);
    if (block.material === 1) Object.assign(m1, vals);
    else Object.assign(m2, vals);
  }
  return { m1, m2 };
}

function dimensionFieldGlobe(
  key: DimensionFieldKey,
  jointType: string,
): ReactNode {
  if (key === "diameter") {
    return <Iso9606TablePdfGlobe table="pipeOd" />;
  }
  if (key === "thickness") {
    return (
      <Iso9606TablePdfGlobe
        table={jointType === "FW" ? "thicknessFw" : "dimensions"}
      />
    );
  }
  return null;
}

function DimensionBlock({
  block,
  values,
  errors,
  invalidBorder,
  onValueChange,
  onFieldChange,
  jointType,
}: {
  block: MaterialDimensionBlock;
  values: Record<string, string>;
  errors?: Record<string, string | undefined>;
  invalidBorder: string;
  onValueChange: (name: string, value: string) => void;
  onFieldChange?: (key: string) => void;
  jointType: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-frost/40 p-4">
      <p className="mb-3 text-sm font-medium text-onyx">{block.title}</p>

      {block.fields.includes("freeText") ? (
        <Field
          label="Free-text dimensions"
          required
          error={errors?.[fieldName(block.material, "freeText")]}
        >
          <Input
            name={fieldName(block.material, "freeText")}
            defaultValue={values[fieldName(block.material, "freeText")] ?? ""}
            placeholder="Describe test piece dimensions"
            required
            className={cn(
              errors?.[fieldName(block.material, "freeText")] && invalidBorder,
            )}
            onChange={(e) => {
              const name = fieldName(block.material, "freeText");
              onValueChange(name, e.target.value);
              onFieldChange?.(name);
            }}
          />
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {block.fields.map((key) => {
            if (key === "freeText") return null;
            const name = fieldName(block.material, key);
            return (
              <Field
                key={name}
                label={FIELD_LABELS[key]}
                hint={key === "thickness" ? "Type — e.g. 12" : undefined}
                required
                error={errors?.[name]}
                labelAccessory={dimensionFieldGlobe(key, jointType)}
              >
                <Input
                  type="number"
                  step="0.1"
                  name={name}
                  defaultValue={values[name] ?? ""}
                  placeholder={
                    key === "thickness"
                      ? "12"
                      : key === "width"
                        ? "300"
                        : key === "length"
                          ? "250"
                          : "168.3"
                  }
                  required
                  className={cn(errors?.[name] && invalidBorder)}
                  onChange={(e) => {
                    onValueChange(name, e.target.value);
                    onFieldChange?.(name);
                  }}
                />
              </Field>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductDimensions({
  product,
  jointType,
  wpq,
  errors,
  onFieldChange,
}: {
  product: ProductType;
  jointType: JointCategory | string;
  wpq?: WpqDimensions;
  errors?: Record<string, string | undefined>;
  onFieldChange?: (key: string) => void;
}) {
  const invalidBorder = "border-ember ring-1 ring-ember/20";
  const blocks = materialDimensionBlocks(product, jointType);
  const layoutKey = `${product}-${jointType}`;

  const initial = useMemo(
    () => buildInitialValues(wpq ?? null, blocks),
    [wpq, blocks, layoutKey],
  );

  const [m1Values, setM1Values] = useState(initial.m1);
  const [m2Values, setM2Values] = useState(initial.m2);
  const [m2Key, setM2Key] = useState(0);

  useEffect(() => {
    setM1Values(initial.m1);
    setM2Values(initial.m2);
    setM2Key((k) => k + 1);
  }, [initial]);

  const copyToMaterial2 = useCallback(() => {
    if (blocks.length < 2) return;
    const [b1, b2] = blocks;
    const next = { ...m2Values };
    for (const key of b2.fields) {
      if (b1.fields.includes(key)) {
        const src = fieldName(1, key);
        const dst = fieldName(2, key);
        next[dst] = m1Values[src] ?? "";
        onFieldChange?.(dst);
      }
    }
    setM2Values(next);
    setM2Key((k) => k + 1);
  }, [blocks, m1Values, m2Values, onFieldChange]);

  const showCopy = blocks.length === 2;

  return (
    <div className="sm:col-span-2 space-y-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-onyx">Product dimensions</p>
            <p className="mt-0.5 text-xs text-steel">
              Fields follow the selected product type and joint type from step 1.
            </p>
          </div>
          <Iso9606TablePdfGlobe table="dimensions" />
        </div>
      </div>

      {blocks.map((block, index) => (
        <div key={block.material === 2 ? `m2-${m2Key}` : `m1-${layoutKey}`}>
          {index === 1 && showCopy ? (
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver bg-panel text-steel transition-colors hover:border-onyx/20 hover:bg-frost hover:text-onyx"
                aria-label="Copy Material 1 dimensions to Material 2"
                title="Same as Material 1"
                onClick={copyToMaterial2}
              >
                <ArrowDown className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}
          <DimensionBlock
            block={block}
            values={block.material === 1 ? m1Values : m2Values}
            errors={errors}
            invalidBorder={invalidBorder}
            jointType={jointType}
            onValueChange={(name, value) => {
              if (block.material === 1) {
                setM1Values((prev) => ({ ...prev, [name]: value }));
              } else {
                setM2Values((prev) => ({ ...prev, [name]: value }));
              }
            }}
            onFieldChange={onFieldChange}
          />
        </div>
      ))}
    </div>
  );
}
