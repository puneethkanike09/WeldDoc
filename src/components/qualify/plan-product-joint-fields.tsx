"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/sui/select";
import { Field } from "@/components/ui/input";
import type { ProductType } from "@/types/db";
import {
  BRANCH_CONNECTIONS,
  jointOptionsForProduct,
  type BranchConnection,
} from "@/lib/iso9606/product-dimensions";
import { BW_POSITIONS, FW_POSITIONS, POSITION_LABELS } from "@/lib/iso9606/constants";
import { Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";

interface PlanProductJointFieldsProps {
  defaultProduct?: ProductType;
  defaultJoint?: string;
  defaultBranchConnection?: BranchConnection | null;
  defaultPosition?: string;
  productError?: string;
  jointError?: string;
  branchError?: string;
  positionError?: string;
  onFieldChange?: (key: string) => void;
  onJointChange?: (joint: string) => void;
}

export function PlanProductJointFields({
  defaultProduct = "Plate",
  defaultJoint = "BW",
  defaultBranchConnection = "set_in",
  defaultPosition = "PF",
  productError,
  jointError,
  branchError,
  positionError,
  onFieldChange,
  onJointChange,
}: PlanProductJointFieldsProps) {
  const [product, setProduct] = useState<ProductType>(
    defaultProduct === "Branch" ? "Pipe" : defaultProduct,
  );
  const jointOptions = useMemo(() => jointOptionsForProduct(product), [product]);
  const [joint, setJoint] = useState(() => {
    if (defaultProduct === "Branch") return "Branch";
    const ok = jointOptions.some((j) => j.value === defaultJoint);
    return ok ? defaultJoint : jointOptions[0]?.value ?? "BW";
  });
  const [branchConnection, setBranchConnection] = useState<BranchConnection>(
    defaultBranchConnection ?? "set_in",
  );

  const positionOptions = useMemo(() => {
    const isFillet = joint === "FW";
    const codes = isFillet ? FW_POSITIONS : BW_POSITIONS;
    return codes.map((p) => ({ value: p, label: POSITION_LABELS[p] ?? p }));
  }, [joint]);

  const [position, setPosition] = useState(() => {
    const ok = positionOptions.some((p) => p.value === defaultPosition);
    return ok ? defaultPosition : positionOptions[0]?.value ?? "PA";
  });

  const invalidBorder = "border-ember ring-1 ring-ember/20";

  const onProductChange = (value: ProductType) => {
    setProduct(value);
    const nextJoints = jointOptionsForProduct(value);
    setJoint((prev) =>
      prev === "Branch" && value === "Pipe"
        ? "Branch"
        : nextJoints.some((j) => j.value === prev)
          ? prev
          : nextJoints[0]?.value ?? "BW",
    );
    onFieldChange?.("product");
    onFieldChange?.("joint_type");
  };

  const onJointChangeInternal = (value: string) => {
    setJoint(value);
    const codes = value === "FW" ? FW_POSITIONS : BW_POSITIONS;
    setPosition((prev) => (codes.includes(prev as never) ? prev : codes[0]));
    onFieldChange?.("joint_type");
    onFieldChange?.("position");
    onJointChange?.(value);
  };

  return (
    <>
      <Field
        label="Product type"
        required
        error={productError}
        labelAccessory={<Iso9606TablePdfGlobe table="productType" />}
      >
        <Select
          name="product"
          value={product}
          required
          className={cn(productError && invalidBorder)}
          onChange={(e) => onProductChange(e.target.value as ProductType)}
        >
          <option value="Plate">Plate</option>
          <option value="Pipe">Pipe</option>
          <option value="Other">Others</option>
        </Select>
      </Field>

      <Field
        label="Joint type"
        required
        error={jointError}
        labelAccessory={<Iso9606TablePdfGlobe table="weldType" />}
      >
        <Select
          name="joint_type"
          value={joint}
          required
          className={cn(jointError && invalidBorder)}
          onChange={(e) => onJointChangeInternal(e.target.value)}
        >
          {jointOptions.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </Select>
      </Field>

      {joint === "Branch" ? (
        <Field
          label="Branch connection"
          required
          error={branchError}
          labelAccessory={<Iso9606TablePdfGlobe table="branchConnection" />}
        >
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

      <Field
        label="Welding position"
        required
        error={positionError}
        labelAccessory={
          <Iso9606TablePdfGlobe
            table={joint === "FW" ? "positionFw" : "positionBw"}
          />
        }
      >
        <Select
          name="position"
          value={position}
          required
          className={cn(positionError && invalidBorder)}
          onChange={(e) => {
            setPosition(e.target.value);
            onFieldChange?.("position");
          }}
        >
          {positionOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
