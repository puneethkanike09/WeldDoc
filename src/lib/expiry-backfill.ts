import {
  computeExpiry,
  computeRevalidationExpiry,
} from "@/lib/expiry";
import {
  computeOperatorExpiry,
  computeOperatorRevalidationExpiry,
} from "@/lib/iso14732/expiry";
import type {
  OperatorRevalidationMethod,
  RevalidationMethod,
  ValidationKind,
} from "@/types/db";

export type BackfillValidationEvent = {
  id: string;
  validated_on: string;
  kind: ValidationKind;
  new_expiry_date?: string | null;
};

export type WelderQualBackfillInput = {
  revalidation_method: RevalidationMethod;
  certificate_issued_date: string | null;
  date_of_welding: string | null;
  expiry_date: string | null;
  continuity_last_verified: string | null;
};

export type OperatorQualBackfillInput = {
  revalidation_method: OperatorRevalidationMethod;
  certificate_issued_date: string | null;
  date_of_welding: string | null;
  expiry_date: string | null;
  continuity_last_verified: string | null;
};

export type BackfillPatch = {
  expiryDate: string | null;
  continuityLastVerified: string | null;
  validationUpdates: Array<{ id: string; newExpiryDate: string | null }>;
};

function isoDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.includes("T") ? value.slice(0, 10) : value;
}

function datesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return isoDateOnly(a ?? null) === isoDateOnly(b ?? null);
}

export function recomputeWelderQualDates(
  qual: WelderQualBackfillInput,
  validations: BackfillValidationEvent[],
): BackfillPatch | null {
  const baseDate =
    isoDateOnly(qual.certificate_issued_date) ??
    isoDateOnly(qual.date_of_welding);
  if (!baseDate) return null;

  let expiry = computeExpiry(qual.revalidation_method, baseDate);
  let continuityLastVerified = baseDate;

  const validationUpdates: BackfillPatch["validationUpdates"] = [];
  const sorted = [...validations].sort((a, b) =>
    isoDateOnly(a.validated_on)!.localeCompare(isoDateOnly(b.validated_on)!),
  );

  for (const v of sorted) {
    const validatedOn = isoDateOnly(v.validated_on)!;
    if (v.kind === "revalidation") {
      expiry = computeRevalidationExpiry(qual.revalidation_method, validatedOn);
      continuityLastVerified = validatedOn;
    } else {
      continuityLastVerified = validatedOn;
    }
    validationUpdates.push({ id: v.id, newExpiryDate: expiry });
  }

  return {
    expiryDate: expiry,
    continuityLastVerified,
    validationUpdates,
  };
}

export function recomputeOperatorQualDates(
  qual: OperatorQualBackfillInput,
  validations: BackfillValidationEvent[],
): BackfillPatch | null {
  const baseDate =
    isoDateOnly(qual.certificate_issued_date) ??
    isoDateOnly(qual.date_of_welding);
  if (!baseDate) return null;

  let expiry = computeOperatorExpiry(baseDate, qual.revalidation_method);
  let continuityLastVerified = baseDate;

  const validationUpdates: BackfillPatch["validationUpdates"] = [];
  const sorted = [...validations].sort((a, b) =>
    isoDateOnly(a.validated_on)!.localeCompare(isoDateOnly(b.validated_on)!),
  );

  for (const v of sorted) {
    const validatedOn = isoDateOnly(v.validated_on)!;
    if (v.kind === "revalidation") {
      expiry = computeOperatorRevalidationExpiry(
        validatedOn,
        qual.revalidation_method,
      );
      continuityLastVerified = validatedOn;
    } else {
      continuityLastVerified = validatedOn;
    }
    validationUpdates.push({ id: v.id, newExpiryDate: expiry });
  }

  return {
    expiryDate: expiry,
    continuityLastVerified,
    validationUpdates,
  };
}

export function diffBackfillPatch(
  qual: {
    expiry_date: string | null;
    continuity_last_verified: string | null;
  },
  validations: BackfillValidationEvent[],
  patch: BackfillPatch,
): {
  qualChanged: boolean;
  validationChanges: Array<{
    id: string;
    from: string | null;
    to: string | null;
  }>;
} {
  const qualChanged =
    !datesEqual(qual.expiry_date, patch.expiryDate) ||
    !datesEqual(qual.continuity_last_verified, patch.continuityLastVerified);

  const byId = new Map(validations.map((v) => [v.id, v]));
  const validationChanges: Array<{
    id: string;
    from: string | null;
    to: string | null;
  }> = [];

  for (const update of patch.validationUpdates) {
    const current = byId.get(update.id);
    if (!current) continue;
    if (!datesEqual(current.new_expiry_date, update.newExpiryDate)) {
      validationChanges.push({
        id: update.id,
        from: isoDateOnly(current.new_expiry_date),
        to: update.newExpiryDate,
      });
    }
  }

  return { qualChanged, validationChanges };
}
