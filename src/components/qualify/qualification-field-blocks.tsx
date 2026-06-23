"use client";

import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import type { JointCategory, ProductType } from "@/types/db";
import {
  fieldName,
  materialDimensionBlocks,
  wpqDimensionValue,
  type DimensionFieldKey,
} from "@/lib/iso9606/product-dimensions";

const FIELD_LABELS: Record<Exclude<DimensionFieldKey, "freeText">, string> = {
  thickness: "Thickness (mm)",
  width: "Width (mm)",
  length: "Length (mm)",
  diameter: "Outside diameter (mm)",
};

export function ProductDimensions({
  product,
  jointType,
  wpq,
  errors,
  onFieldChange,
}: {
  product: ProductType;
  jointType: JointCategory | string;
  wpq?: {
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
  errors?: Record<string, string | undefined>;
  onFieldChange?: (key: string) => void;
}) {
  const invalidBorder = "border-ember ring-1 ring-ember/20";
  const blocks = materialDimensionBlocks(product, jointType);

  return (
    <div className="sm:col-span-2 space-y-5">
      <div>
        <p className="text-sm font-medium text-onyx">Product dimensions</p>
        <p className="mt-0.5 text-xs text-steel">
          Fields follow the selected product type and joint type from step 1.
        </p>
      </div>

      {blocks.map((block) => (
        <div
          key={`${block.material}-${block.title}`}
          className="rounded-[var(--radius-card)] border border-silver bg-white/60 p-4"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-steel">
            {block.title}
          </p>

          {block.fields.includes("freeText") ? (
            <Field
              label="Free-text dimensions"
              required
              error={errors?.[fieldName(block.material, "freeText")]}
            >
              <Input
                name={fieldName(block.material, "freeText")}
                defaultValue={
                  String(wpqDimensionValue(wpq, block.material, "freeText") ?? "")
                }
                placeholder="Describe test piece dimensions"
                required
                className={cn(
                  errors?.[fieldName(block.material, "freeText")] && invalidBorder,
                )}
                onChange={() =>
                  onFieldChange?.(fieldName(block.material, "freeText"))
                }
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
                  >
                    <Input
                      type="number"
                      step="0.1"
                      name={name}
                      defaultValue={
                        String(wpqDimensionValue(wpq, block.material, key) ?? "")
                      }
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
                      onChange={() => onFieldChange?.(name)}
                    />
                  </Field>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
