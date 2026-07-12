/**
 * Verify all org qualifications match client expiry/continuity rules.
 *
 * Usage: npx tsx scripts/verify-expiry-backfill.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  diffBackfillPatch,
  recomputeOperatorQualDates,
  recomputeWelderQualDates,
  type BackfillValidationEvent,
} from "../src/lib/expiry-backfill";
import { continuityDue } from "../src/lib/expiry";
import { operatorContinuityDue } from "../src/lib/iso14732/expiry";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
  }
}

function isoDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.includes("T") ? value.slice(0, 10) : value;
}

type Issue = {
  org: string;
  entity: "welder" | "operator";
  qualId: string;
  process: string | null;
  plantId: string | null;
  name: string | null;
  field: string;
  stored: string | null;
  expected: string | null;
  note?: string;
};

async function main() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");
  if (orgErr) throw new Error(orgErr.message);

  const issues: Issue[] = [];
  const orgSummaries: Array<{
    name: string;
    welderQuals: number;
    operatorQuals: number;
    ok: boolean;
  }> = [];

  for (const org of orgs ?? []) {
    let welderQuals = 0;
    let operatorQuals = 0;
    let orgOk = true;

    const { data: wpqs } = await supabase
      .from("qualification_records")
      .select(
        "id, process, revalidation_method, certificate_issued_date, date_of_welding, expiry_date, continuity_last_verified, welder_id",
      )
      .eq("org_id", org.id);

    const wpqIds = (wpqs ?? []).map((q) => q.id);
    welderQuals = wpqIds.length;

    const welderNameById = new Map<string, { name: string; plantId: string | null }>();
    const welderIds = [...new Set((wpqs ?? []).map((q) => q.welder_id))];
    if (welderIds.length) {
      const { data: welders } = await supabase
        .from("welders")
        .select("id, full_name, welder_id")
        .in("id", welderIds);
      for (const w of welders ?? []) {
        welderNameById.set(w.id, { name: w.full_name, plantId: w.welder_id });
      }
    }

    const { data: welderVals } = wpqIds.length
      ? await supabase
          .from("validation_records")
          .select("id, wpq_id, validated_on, kind, new_expiry_date")
          .eq("org_id", org.id)
          .in("wpq_id", wpqIds)
      : { data: [] };

    const welderValsByWpq = new Map<string, BackfillValidationEvent[]>();
    for (const v of welderVals ?? []) {
      const arr = welderValsByWpq.get(v.wpq_id) ?? [];
      arr.push(v as BackfillValidationEvent);
      welderValsByWpq.set(v.wpq_id, arr);
    }

    for (const qual of wpqs ?? []) {
      const events = welderValsByWpq.get(qual.id) ?? [];
      const patch = recomputeWelderQualDates(qual, events);
      const w = welderNameById.get(qual.welder_id);
      const base = {
        org: org.name,
        entity: "welder" as const,
        qualId: qual.id,
        process: qual.process,
        plantId: w?.plantId ?? null,
        name: w?.name ?? null,
      };

      if (!patch) {
        if (qual.expiry_date || qual.continuity_last_verified) {
          orgOk = false;
          issues.push({
            ...base,
            field: "base_date",
            stored: isoDateOnly(qual.date_of_welding),
            expected: null,
            note: "Missing certificate_issued_date and date_of_welding but has expiry/continuity",
          });
        }
        continue;
      }

      const { qualChanged, validationChanges } = diffBackfillPatch(
        qual,
        events,
        patch,
      );

      if (qualChanged) {
        orgOk = false;
        if (isoDateOnly(qual.expiry_date) !== patch.expiryDate) {
          issues.push({
            ...base,
            field: "expiry_date",
            stored: isoDateOnly(qual.expiry_date),
            expected: patch.expiryDate,
          });
        }
        if (isoDateOnly(qual.continuity_last_verified) !== patch.continuityLastVerified) {
          issues.push({
            ...base,
            field: "continuity_last_verified",
            stored: isoDateOnly(qual.continuity_last_verified),
            expected: patch.continuityLastVerified,
          });
        }
      }

      for (const change of validationChanges) {
        orgOk = false;
        issues.push({
          ...base,
          field: `validation:${change.id.slice(0, 8)}:new_expiry_date`,
          stored: change.from,
          expected: change.to,
        });
      }

      // Rule 4 spot-check: continuity due display = +6 months from continuity_last_verified
      if (patch.continuityLastVerified) {
        const due = continuityDue(patch.continuityLastVerified);
        if (!due) {
          orgOk = false;
          issues.push({
            ...base,
            field: "continuity_due",
            stored: null,
            expected: "computed",
            note: "continuityDue returned null",
          });
        }
      }
    }

    const { data: oqs } = await supabase
      .from("operator_qualifications")
      .select(
        "id, process, revalidation_method, certificate_issued_date, date_of_welding, expiry_date, continuity_last_verified, operator_id",
      )
      .eq("org_id", org.id);

    const oqIds = (oqs ?? []).map((q) => q.id);
    operatorQuals = oqIds.length;

    const opNameById = new Map<string, { name: string; plantId: string | null }>();
    const opIds = [...new Set((oqs ?? []).map((q) => q.operator_id))];
    if (opIds.length) {
      const { data: ops } = await supabase
        .from("operators")
        .select("id, full_name, operator_id")
        .in("id", opIds);
      for (const o of ops ?? []) {
        opNameById.set(o.id, { name: o.full_name, plantId: o.operator_id });
      }
    }

    const { data: opVals } = oqIds.length
      ? await supabase
          .from("operator_validations")
          .select("id, oq_id, validated_on, kind, new_expiry_date")
          .eq("org_id", org.id)
          .in("oq_id", oqIds)
      : { data: [] };

    const opValsByOq = new Map<string, BackfillValidationEvent[]>();
    for (const v of opVals ?? []) {
      const arr = opValsByOq.get(v.oq_id) ?? [];
      arr.push({
        id: v.id,
        validated_on: v.validated_on,
        kind: v.kind,
        new_expiry_date: v.new_expiry_date,
      });
      opValsByOq.set(v.oq_id, arr);
    }

    for (const qual of oqs ?? []) {
      const events = opValsByOq.get(qual.id) ?? [];
      const patch = recomputeOperatorQualDates(qual, events);
      const o = opNameById.get(qual.operator_id);
      const base = {
        org: org.name,
        entity: "operator" as const,
        qualId: qual.id,
        process: qual.process,
        plantId: o?.plantId ?? null,
        name: o?.name ?? null,
      };

      if (!patch) continue;

      const { qualChanged, validationChanges } = diffBackfillPatch(
        qual,
        events,
        patch,
      );

      if (qualChanged) {
        orgOk = false;
        if (isoDateOnly(qual.expiry_date) !== patch.expiryDate) {
          issues.push({
            ...base,
            field: "expiry_date",
            stored: isoDateOnly(qual.expiry_date),
            expected: patch.expiryDate,
          });
        }
        if (isoDateOnly(qual.continuity_last_verified) !== patch.continuityLastVerified) {
          issues.push({
            ...base,
            field: "continuity_last_verified",
            stored: isoDateOnly(qual.continuity_last_verified),
            expected: patch.continuityLastVerified,
          });
        }
      }

      for (const change of validationChanges) {
        orgOk = false;
        issues.push({
          ...base,
          field: `validation:${change.id.slice(0, 8)}:new_expiry_date`,
          stored: change.from,
          expected: change.to,
        });
      }

      if (patch.continuityLastVerified) {
        const due = operatorContinuityDue(patch.continuityLastVerified);
        if (!due) {
          orgOk = false;
          issues.push({
            ...base,
            field: "continuity_due",
            stored: null,
            expected: "computed",
            note: "operatorContinuityDue returned null",
          });
        }
      }
    }

    orgSummaries.push({
      name: org.name,
      welderQuals,
      operatorQuals,
      ok: orgOk,
    });
  }

  // Client example checks (search by known data)
  const clientChecks: Array<{
    label: string;
    ok: boolean;
    detail: string;
  }> = [];

  // Submerged 121 — L&T process 121 with revalidation
  const { data: submerged } = await supabase
    .from("qualification_records")
    .select(
      "id, process, date_of_welding, expiry_date, continuity_last_verified, revalidation_method, welder_id, org_id",
    )
    .eq("process", "121")
    .eq("date_of_welding", "2026-02-25")
    .maybeSingle();

  if (submerged) {
    const { data: vals } = await supabase
      .from("validation_records")
      .select("validated_on, kind")
      .eq("wpq_id", submerged.id)
      .order("validated_on", { ascending: true });
    const revals = (vals ?? []).filter((v) => v.kind === "revalidation");
    const latestReval = revals[revals.length - 1]?.validated_on;
    const contDue = submerged.continuity_last_verified
      ? continuityDue(submerged.continuity_last_verified)
      : null;
    const ok =
      isoDateOnly(submerged.expiry_date) === "2030-02-25" &&
      isoDateOnly(submerged.continuity_last_verified) === "2028-02-25" &&
      contDue === "2028-08-25";
    clientChecks.push({
      label: "Submerged 121 (25 Feb 2026 weld, reval 25 Feb 2028)",
      ok,
      detail: `expiry=${isoDateOnly(submerged.expiry_date)} (want 2030-02-25), continuity_last=${isoDateOnly(submerged.continuity_last_verified)} (want 2028-02-25), due=${contDue} (want 2028-08-25), revals=${revals.map((r) => isoDateOnly(r.validated_on)).join(",")}`,
    });
  } else {
    clientChecks.push({
      label: "Submerged 121 example",
      ok: true,
      detail: "Not found in DB (skipped)",
    });
  }

  // Sanjay Yadav — test 19 Aug 2025
  const { data: sanjayWelder } = await supabase
    .from("welders")
    .select("id")
    .ilike("full_name", "%Sanjay Yadav%")
    .maybeSingle();

  if (sanjayWelder) {
    const { data: sanjayQuals } = await supabase
      .from("qualification_records")
      .select("id, process, date_of_welding, expiry_date, continuity_last_verified")
      .eq("welder_id", sanjayWelder.id)
      .eq("date_of_welding", "2025-08-19");

    for (const q of sanjayQuals ?? []) {
      const { data: vals } = await supabase
        .from("validation_records")
        .select("validated_on, kind")
        .eq("wpq_id", q.id);
      const hasReval2027 = (vals ?? []).some(
        (v) =>
          v.kind === "revalidation" &&
          isoDateOnly(v.validated_on) === "2027-08-19",
      );
      const contDue = q.continuity_last_verified
        ? continuityDue(q.continuity_last_verified)
        : null;
      const initialOk = isoDateOnly(q.expiry_date) === "2027-08-18";
      const revalOk = hasReval2027
        ? isoDateOnly(q.continuity_last_verified) === "2027-08-19" &&
          contDue === "2028-02-19"
        : initialOk && contDue === "2028-02-19"
          ? false
          : true;
      clientChecks.push({
        label: `Sanjay Yadav process ${q.process} (test 19 Aug 2025)`,
        ok: hasReval2027 ? revalOk : initialOk,
        detail: `expiry=${isoDateOnly(q.expiry_date)} (want ${hasReval2027 ? "2029-08-19 if reval" : "2027-08-18"}), continuity_last=${isoDateOnly(q.continuity_last_verified)}, due=${contDue} (want ${hasReval2027 ? "2028-02-19" : "2027-02-19 or from last event"})`,
      });
    }
  }

  // Report
  console.log("=== Organisation summary ===\n");
  for (const s of orgSummaries) {
    console.log(
      `${s.ok ? "OK" : "ISSUES"}  ${s.name} — ${s.welderQuals} welder qual(s), ${s.operatorQuals} operator qual(s)`,
    );
  }

  console.log("\n=== Client example checks ===\n");
  for (const c of clientChecks) {
    console.log(`${c.ok ? "OK" : "FAIL"}  ${c.label}`);
    console.log(`       ${c.detail}`);
  }

  if (issues.length) {
    console.log(`\n=== Mismatches (${issues.length}) ===\n`);
    for (const i of issues) {
      console.log(
        `${i.org} | ${i.entity} | ${i.plantId ?? "?"} ${i.name ?? ""} | process ${i.process ?? "—"}`,
      );
      console.log(
        `  ${i.field}: stored=${i.stored ?? "—"} expected=${i.expected ?? "—"}${i.note ? ` (${i.note})` : ""}`,
      );
    }
    console.log(`\nRESULT: NOT OK — ${issues.length} field(s) still mismatch rules.`);
    process.exitCode = 1;
  } else {
    const allClientOk = clientChecks.every((c) => c.ok);
    if (allClientOk) {
      console.log("\nRESULT: OK — all qualifications match client rules.");
    } else {
      console.log("\nRESULT: NOT OK — client example checks failed.");
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
