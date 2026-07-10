import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendExpiryDigest,
  sendExpiryStatusDigest,
  type ExpiryAlert,
} from "@/lib/email";
import { continuityDue } from "@/lib/expiry";
import { operatorContinuityDue } from "@/lib/iso14732/expiry";
import { processLabel as welderProcessLabel } from "@/lib/iso9606/constants";
import { processLabel as operatorProcessLabel } from "@/lib/iso14732/constants";
import {
  bucketFor,
  daysUntil,
  inLeadWindow,
  normalizeFrequency,
  orgDigestKind,
  ORG_DIGEST_ALERT_TYPE,
} from "@/lib/expiry-alerts/cron-logic";
import {
  shouldSendOrgDigest,
  usesRepeatingDigest,
} from "@/lib/expiry-alerts/frequency";
import {
  isWithinSendWindow,
  parseAlertEmailTime,
  parseAlertEmailTimezone,
  ALERT_CRON_IS_DAILY,
} from "@/lib/expiry-alerts/send-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BuiltAlert = ExpiryAlert & {
  wpqId: string;
  alertType: string;
  keyDate: string;
};

type OpAlert = ExpiryAlert & {
  oqId: string;
  alertType: string;
  keyDate: string;
};

async function filterFreshWelderAlerts(
  supabase: ReturnType<typeof createAdminClient>,
  alerts: BuiltAlert[],
): Promise<BuiltAlert[]> {
  const fresh: BuiltAlert[] = [];
  for (const a of alerts) {
    const { data: existing } = await supabase
      .from("notification_log")
      .select("id")
      .eq("wpq_id", a.wpqId)
      .eq("alert_type", a.alertType)
      .eq("expiry_date", a.keyDate)
      .eq("status", "sent")
      .maybeSingle();
    if (!existing) fresh.push(a);
  }
  return fresh;
}

async function filterFreshOperatorAlerts(
  supabase: ReturnType<typeof createAdminClient>,
  alerts: OpAlert[],
): Promise<OpAlert[]> {
  const fresh: OpAlert[] = [];
  for (const a of alerts) {
    const { data: existing } = await supabase
      .from("notification_log")
      .select("id")
      .eq("operator_qualification_id", a.oqId)
      .eq("alert_type", a.alertType)
      .eq("expiry_date", a.keyDate)
      .eq("status", "sent")
      .maybeSingle();
    if (!existing) fresh.push(a);
  }
  return fresh;
}

async function lastOrgDigestSentAt(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string,
): Promise<Date | null> {
  const { data } = await supabase
    .from("notification_log")
    .select("sent_at")
    .eq("org_id", orgId)
    .eq("alert_type", ORG_DIGEST_ALERT_TYPE)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.sent_at) return null;
  const d = new Date(data.sent_at);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.VERCEL === "1" && !secret) {
    return new NextResponse("CRON_SECRET not configured", { status: 503 });
  }
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date();
  const checkedOn = now.toISOString().slice(0, 10);
  const { data: orgs } = await supabase.from("organizations").select("*");

  let totalSent = 0;
  const summary: Record<string, number> = {};

  for (const org of orgs ?? []) {
    const leadDays: number[] = org.alert_lead_days?.length
      ? org.alert_lead_days
      : [30, 7];
    const maxLead = Math.max(...leadDays);
    const recipients: string[] = org.alert_emails ?? [];
    const frequency = normalizeFrequency(org.alert_email_frequency);
    const sendTime = parseAlertEmailTime(org.alert_email_time);
    const timeZone = parseAlertEmailTimezone(org.alert_email_timezone);
    const repeating = usesRepeatingDigest(frequency);

    if (recipients.length === 0) continue;

    if (
      !ALERT_CRON_IS_DAILY &&
      !isWithinSendWindow(now, sendTime, timeZone)
    ) {
      continue;
    }

    const lastSentAt = repeating
      ? await lastOrgDigestSentAt(supabase, org.id)
      : null;

    if (!shouldSendOrgDigest(frequency, now, lastSentAt, timeZone)) continue;

    const welderAlerts: BuiltAlert[] = [];
    const welders = new Map<
      string,
      { id: string; full_name: string; welder_id: string | null }
    >();

    const { data: wpqs } = await supabase
      .from("qualification_records")
      .select(
        "id, process, expiry_date, continuity_last_verified, wpq_status, welder_id, revalidation_method",
      )
      .eq("org_id", org.id)
      .eq("wpq_status", "Approved")
      .eq("is_active", true);

    if (wpqs && wpqs.length > 0) {
      const welderIds = Array.from(new Set(wpqs.map((w) => w.welder_id)));
      const { data: welderRows } = await supabase
        .from("welders")
        .select("id, full_name, welder_id")
        .in("id", welderIds);
      for (const w of welderRows ?? []) {
        welders.set(w.id, w);
      }

      for (const w of wpqs) {
        const welder = welders.get(w.welder_id);
        if (!welder) continue;

        if (w.expiry_date) {
          const dleft = daysUntil(w.expiry_date);
          const inWindow = repeating
            ? inLeadWindow(dleft, leadDays)
            : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
          if (inWindow) {
            const bucket = bucketFor(dleft, leadDays) ?? "snapshot";
            welderAlerts.push({
              welderName: welder.full_name,
              plantWelderId: welder.welder_id ?? "—",
              process: welderProcessLabel(w.process),
              validityCode: w.revalidation_method ?? "9.3b",
              expiryDate: w.expiry_date,
              daysLeft: dleft,
              reminderKind: "certificate",
              wpqId: w.id,
              alertType: `expiry-${bucket}`,
              keyDate: w.expiry_date,
            });
          }
        }

        const due = continuityDue(w.continuity_last_verified);
        if (due) {
          const dleft = daysUntil(due);
          const inWindow = repeating
            ? inLeadWindow(dleft, leadDays)
            : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
          if (inWindow) {
            const bucket = bucketFor(dleft, leadDays) ?? "snapshot";
            welderAlerts.push({
              welderName: welder.full_name,
              plantWelderId: welder.welder_id ?? "—",
              process: welderProcessLabel(w.process),
              validityCode: w.revalidation_method ?? "9.3b",
              expiryDate: due,
              daysLeft: dleft,
              reminderKind: "continuity",
              wpqId: w.id,
              alertType: `continuity-${bucket}`,
              keyDate: due,
            });
          }
        }
      }
    }

    const opAlerts: OpAlert[] = [];
    const operators = new Map<
      string,
      { id: string; full_name: string; operator_id: string | null }
    >();

    const { data: oqs } = await supabase
      .from("operator_qualifications")
      .select(
        "id, process, expiry_date, continuity_last_verified, oq_status, operator_id, revalidation_method",
      )
      .eq("org_id", org.id)
      .eq("oq_status", "Approved")
      .eq("is_active", true);

    if (oqs && oqs.length > 0) {
      const operatorIds = Array.from(new Set(oqs.map((o) => o.operator_id)));
      const { data: operatorRows } = await supabase
        .from("operators")
        .select("id, full_name, operator_id")
        .in("id", operatorIds);
      for (const o of operatorRows ?? []) {
        operators.set(o.id, o);
      }

      for (const o of oqs) {
        const operator = operators.get(o.operator_id);
        if (!operator) continue;

        if (o.expiry_date) {
          const dleft = daysUntil(o.expiry_date);
          const inWindow = repeating
            ? inLeadWindow(dleft, leadDays)
            : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
          if (inWindow) {
            const bucket = bucketFor(dleft, leadDays) ?? "snapshot";
            opAlerts.push({
              welderName: operator.full_name,
              plantWelderId: operator.operator_id ?? "—",
              process: operatorProcessLabel(o.process),
              validityCode: o.revalidation_method ?? "6.3b",
              expiryDate: o.expiry_date,
              daysLeft: dleft,
              reminderKind: "certificate",
              oqId: o.id,
              alertType: `op-expiry-${bucket}`,
              keyDate: o.expiry_date,
            });
          }
        }

        const due = operatorContinuityDue(o.continuity_last_verified);
        if (due) {
          const dleft = daysUntil(due);
          const inWindow = repeating
            ? inLeadWindow(dleft, leadDays)
            : dleft <= maxLead && bucketFor(dleft, leadDays) !== null;
          if (inWindow) {
            const bucket = bucketFor(dleft, leadDays) ?? "snapshot";
            opAlerts.push({
              welderName: operator.full_name,
              plantWelderId: operator.operator_id ?? "—",
              process: operatorProcessLabel(o.process),
              validityCode: o.revalidation_method ?? "6.3b",
              expiryDate: due,
              daysLeft: dleft,
              reminderKind: "continuity",
              oqId: o.id,
              alertType: `op-continuity-${bucket}`,
              keyDate: due,
            });
          }
        }
      }
    }

    const welderForSend = repeating
      ? welderAlerts
      : await filterFreshWelderAlerts(supabase, welderAlerts);
    const opForSend = repeating
      ? opAlerts
      : await filterFreshOperatorAlerts(supabase, opAlerts);

    const combinedOrgAlerts: ExpiryAlert[] = [...welderForSend, ...opForSend];

    if (!repeating && combinedOrgAlerts.length === 0) continue;

    const kind = orgDigestKind(welderForSend.length, opForSend.length);

    const result = repeating
      ? await sendExpiryStatusDigest(
          recipients,
          org.name,
          combinedOrgAlerts,
          leadDays,
          checkedOn,
          kind,
        )
      : await sendExpiryDigest(recipients, org.name, combinedOrgAlerts, kind);

    if (result.sent) {
      if (repeating) {
        await supabase.from("notification_log").insert({
          org_id: org.id,
          alert_type: ORG_DIGEST_ALERT_TYPE,
          expiry_date: null,
          channel: "email",
          status: "sent",
        });
      } else {
        for (const a of welderForSend) {
          await supabase.from("notification_log").insert({
            org_id: org.id,
            wpq_id: a.wpqId,
            alert_type: a.alertType,
            expiry_date: a.keyDate,
            channel: "email",
            status: "sent",
          });
        }
        for (const a of opForSend) {
          await supabase.from("notification_log").insert({
            org_id: org.id,
            operator_qualification_id: a.oqId,
            alert_type: a.alertType,
            expiry_date: a.keyDate,
            channel: "email",
            status: "sent",
          });
        }
      }
      totalSent += combinedOrgAlerts.length || 1;
      summary[org.name] = combinedOrgAlerts.length;
    }
  }

  return NextResponse.json({
    ok: true,
    totalSent,
    summary,
  });
}
