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
  defaultPosition2?: string;
  showSecondPosition?: boolean;
  process1Code?: string;
  process2Code?: string;
  productError?: string;
  jointError?: string;
  branchError?: string;
  positionError?: string;
  position2Error?: string;
  onFieldChange?: (key: string) => void;
  onJointChange?: (joint: string) => void;
}

export function PlanProductJointFields({
  defaultProduct = "Plate",
  defaultJoint = "BW",
  defaultBranchConnection = "set_in",
  defaultPosition = "PF",
  defaultPosition2 = "PF",
  showSecondPosition = false,
  process1Code,
  process2Code,
  productError,
  jointError,
  branchError,
  positionError,
  position2Error,
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
  const [position2, setPosition2] = useState(() => {
    const ok = positionOptions.some((p) => p.value === defaultPosition2);
    return ok ? defaultPosition2 : positionOptions[0]?.value ?? "PA";
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
    setPosition2((prev) => (codes.includes(prev as never) ? prev : codes[0]));
    onFieldChange?.("joint_type");
    onFieldChange?.("position");
    onFieldChange?.("position_2");
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
        label={
          showSecondPosition && process1Code
            ? `Welding position — process ${process1Code}`
            : "Welding position"
        }
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

      {showSecondPosition ? (
        <Field
          label={
            process2Code
              ? `Welding position — process ${process2Code}`
              : "Welding position (process 2)"
          }
          required
          error={position2Error}
          labelAccessory={
            <Iso9606TablePdfGlobe
              table={joint === "FW" ? "positionFw" : "positionBw"}
            />
          }
        >
          <Select
            name="position_2"
            value={position2}
            required
            className={cn(position2Error && invalidBorder)}
            onChange={(e) => {
              setPosition2(e.target.value);
              onFieldChange?.("position_2");
            }}
          >
            {positionOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </>
  );
}
