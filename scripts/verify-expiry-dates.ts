/**
 * Verify expiry / continuity date rules against client examples.
 *
 * Usage: npx tsx scripts/verify-expiry-dates.ts
 */
import {
  computeExpiry,
  computeRevalidationExpiry,
  continuityDue,
} from "../src/lib/expiry";
import { recomputeWelderQualDates } from "../src/lib/expiry-backfill";

function assertEq(actual: string | null, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function run() {
  // Submerged 121 — welding 25 Feb 2026, method 9.3b (24 months)
  assertEq(
    computeExpiry("9.3b", "2026-02-25"),
    "2028-02-24",
    "initial expiry (day before anniversary)",
  );

  // Revalidation 25 Feb 2028 → +2 years on the date
  assertEq(
    computeRevalidationExpiry("9.3b", "2028-02-25"),
    "2030-02-25",
    "revalidation expiry",
  );

  // Continuity due +6 months from revalidation
  assertEq(
    continuityDue("2028-02-25"),
    "2028-08-25",
    "continuity due after revalidation",
  );

  // Sanjay Yadav — test 19 Aug 2025
  assertEq(
    computeExpiry("9.3b", "2025-08-19"),
    "2027-08-18",
    "Sanjay initial expiry",
  );

  // Revalidation 19 Aug 2027 → continuity due 19 Feb 2028 (not old pre-reval date)
  assertEq(
    continuityDue("2027-08-19"),
    "2028-02-19",
    "Sanjay continuity due after revalidation",
  );

  assertEq(
    computeRevalidationExpiry("9.3b", "2027-08-19"),
    "2029-08-19",
    "Sanjay revalidation expiry",
  );

  // 6-month continuity from a continuity log entry
  assertEq(continuityDue("2026-02-25"), "2026-08-25", "continuity +6 months");

  // Backfill replay — initial + revalidation
  const patch = recomputeWelderQualDates(
    {
      revalidation_method: "9.3b",
      certificate_issued_date: "2026-02-25",
      date_of_welding: "2026-02-25",
      expiry_date: "2032-02-25",
      continuity_last_verified: "2026-01-15",
    },
    [
      {
        id: "v1",
        validated_on: "2028-02-25",
        kind: "revalidation",
        new_expiry_date: "2032-02-25",
      },
    ],
  );
  if (!patch) throw new Error("backfill patch missing");
  assertEq(patch.expiryDate, "2030-02-25", "backfill expiry after revalidation");
  assertEq(
    patch.continuityLastVerified,
    "2028-02-25",
    "backfill continuity after revalidation",
  );

  console.log("All expiry date rule checks passed.");
}

run();
