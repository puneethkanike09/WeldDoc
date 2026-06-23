"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import type { ProductType } from "@/types/db";
import {
  BRANCH_CONNECTIONS,
  jointOptionsForProduct,
  type BranchConnection,
} from "@/lib/iso9606/product-dimensions";

interface PlanProductJointFieldsProps {
  defaultProduct?: ProductType;
  defaultJoint?: string;
  defaultBranchConnection?: BranchConnection | null;
  productError?: string;
  jointError?: string;
  branchError?: string;
  onFieldChange?: (key: string) => void;
}

export function PlanProductJointFields({
  defaultProduct = "Plate",
  defaultJoint = "BW",
  defaultBranchConnection = "set_in",
  productError,
  jointError,
  branchError,
  onFieldChange,
}: PlanProductJointFieldsProps) {
  const [product, setProduct] = useState<ProductType>(defaultProduct);
  const jointOptions = useMemo(() => jointOptionsForProduct(product), [product]);
  const [joint, setJoint] = useState(() => {
    const ok = jointOptions.some((j) => j.value === defaultJoint);
    return ok ? defaultJoint : jointOptions[0]?.value ?? "BW";
  });
  const [branchConnection, setBranchConnection] = useState<BranchConnection>(
    defaultBranchConnection ?? "set_in",
  );

  const invalidBorder = "border-ember ring-1 ring-ember/20";

  const onProductChange = (value: ProductType) => {
    setProduct(value);
    const nextJoints = jointOptionsForProduct(value);
    setJoint((prev) =>
      nextJoints.some((j) => j.value === prev) ? prev : nextJoints[0]?.value ?? "BW",
    );
    onFieldChange?.("product");
    onFieldChange?.("joint_type");
  };

  return (
    <>
      <Field label="Product type" required error={productError}>
        <Select
          name="product"
          value={product}
          required
          className={cn(productError && invalidBorder)}
          onChange={(e) => onProductChange(e.target.value as ProductType)}
        >
          <option value="Plate">Plate</option>
          <option value="Pipe">Pipe</option>
          <option value="Branch">Branch</option>
          <option value="Other">Others</option>
        </Select>
      </Field>

      {product === "Branch" ? (
        <Field label="Branch connection" required error={branchError}>
          <Select
            name="branch_connection"
            value={branchConnection}
            required
            className={cn(branchError && invalidBorder)}
            onChange={(e) => {
              setBranchConnection(e.target.value as BranchConnection);
              onFieldChange?.("branch_connection");
            }}
          >
            {BRANCH_CONNECTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Joint type" required error={jointError}>
        <Select
          name="joint_type"
          value={joint}
          required
          className={cn(jointError && invalidBorder)}
          onChange={(e) => {
            setJoint(e.target.value);
            onFieldChange?.("joint_type");
          }}
        >
          {jointOptions.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
