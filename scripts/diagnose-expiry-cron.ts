/**
 * Diagnose why expiry cron might skip Puneeth's org.
 * Usage: npx tsx scripts/diagnose-expiry-cron.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { continuityDue } from "../src/lib/expiry";
import { operatorContinuityDue } from "../src/lib/iso14732/expiry";
import {
  bucketFor,
  daysUntil,
  inLeadWindow,
  normalizeFrequency,
} from "../src/lib/expiry-alerts/cron-logic";
import {
  shouldSendOrgDigest,
  usesRepeatingDigest,
} from "../src/lib/expiry-alerts/frequency";
import {
  ALERT_CRON_IS_DAILY,
  isWithinSendWindow,
  parseAlertEmailTime,
  parseAlertEmailTimezone,
} from "../src/lib/expiry-alerts/send-time";
import { sendExpiryStatusDigest, sendExpiryDigest } from "../src/lib/email";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  const key = t.slice(0, i).trim();
  if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const now = new Date();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .ilike("name", "%Puneeth%")
    .single();
  if (!org) throw new Error("org not found");

  const leadDays: number[] = org.alert_lead_days?.length
    ? org.alert_lead_days
    : [30, 7];
  const maxLead = Math.max(...leadDays);
  const recipients: string[] = org.alert_emails ?? [];
  const frequency = normalizeFrequency(org.alert_email_frequency);
  const sendTime = parseAlertEmailTime(org.alert_email_time);
  const timeZone = parseAlertEmailTimezone(org.alert_email_timezone);
  const repeating = usesRepeatingDigest(frequency);

  console.log({
    ALERT_CRON_IS_DAILY,
    frequency,
    repeating,
    sendTime,
    timeZone,
    alert_next_run_at: org.alert_next_run_at ?? null,
    recipients,
    leadDays,
    withinWindow: isWithinSendWindow(now, sendTime, timeZone),
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "set" : "MISSING",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  });

  const { data: last } = await supabase
    .from("notification_log")
    .select("sent_at, alert_type")
    .eq("org_id", org.id)
    .eq("alert_type", "org-digest")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastSentAt = last?.sent_at ? new Date(last.sent_at) : null;
  console.log("last digest", last);
  console.log(
    "shouldSendOrgDigest",
    shouldSendOrgDigest(frequency, now, lastSentAt, timeZone),
  );

  const { data: wpqs } = await supabase
    .from("qualification_records")
    .select(
      "id, process, process_2, expiry_date, continuity_last_verified, welder_id, revalidation_method",
    )
    .eq("org_id", org.id)
    .eq("wpq_status", "Approved")
    .eq("is_active", true);

  let alertCount = 0;
  for (const w of wpqs ?? []) {
    if (w.expiry_date) {
      const dleft = daysUntil(w.expiry_date);
      const inWindow = repeating
        ? inLeadWindow(dleft, leadDays)
        : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
      if (inWindow) {
        alertCount++;
        console.log("expiry alert", w.process, w.expiry_date, dleft);
      }
    }
    const due = continuityDue(w.continuity_last_verified);
    if (due) {
      const dleft = daysUntil(due);
      const inWindow = repeating
        ? inLeadWindow(dleft, leadDays)
        : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
      if (inWindow) {
        alertCount++;
        console.log("continuity alert", w.process, due, dleft);
      }
    }
  }

  const { data: oqs } = await supabase
    .from("operator_qualifications")
    .select(
      "id, process, expiry_date, continuity_last_verified, revalidation_method",
    )
    .eq("org_id", org.id)
    .eq("oq_status", "Approved")
    .eq("is_active", true);

  for (const o of oqs ?? []) {
    if (o.expiry_date) {
      const dleft = daysUntil(o.expiry_date);
      const inWindow = repeating
        ? inLeadWindow(dleft, leadDays)
        : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
      if (inWindow) {
        alertCount++;
        console.log("op expiry", o.process, o.expiry_date, dleft);
      }
    }
    const due = operatorContinuityDue(o.continuity_last_verified);
    if (due) {
      const dleft = daysUntil(due);
      const inWindow = repeating
        ? inLeadWindow(dleft, leadDays)
        : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
      if (inWindow) {
        alertCount++;
        console.log("op continuity", o.process, due, dleft);
      }
    }
  }

  console.log("total alert rows", alertCount);

  if (process.argv.includes("--send")) {
    const sample = [
      {
        welderName: "Test Welder",
        plantWelderId: "W#TEST",
        process: "135",
        validityCode: "9.3b",
        expiryDate: "2026-07-13",
        daysLeft: -1,
        reminderKind: "certificate" as const,
      },
    ];
    const result = repeating
      ? await sendExpiryStatusDigest(
          recipients,
          org.name,
          sample,
          leadDays,
          now.toISOString().slice(0, 10),
          "welder",
        )
      : await sendExpiryDigest(recipients, org.name, sample, "welder");
    console.log("send result", result);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
