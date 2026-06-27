import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendExpiryDigest,
  sendWelderExpiryDigest,
  type ExpiryAlert,
} from "@/lib/email";
import { continuityDue } from "@/lib/expiry";
import { processLabel } from "@/lib/iso9606/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 1000 * 60 * 60 * 24;

type BuiltAlert = ExpiryAlert & {
  welderId: string;
  wpqId: string;
  alertType: string;
  keyDate: string;
};

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY);
}

function bucketFor(daysLeft: number, leadDays: number[]): string | null {
  if (daysLeft < 0) return "overdue";
  const sorted = [...leadDays].sort((a, b) => a - b);
  for (const lead of sorted) {
    if (daysLeft <= lead) return `d${lead}`;
  }
  return null;
}

async function filterFreshAlerts(
  supabase: ReturnType<typeof createAdminClient>,
  alerts: BuiltAlert[],
  welderId: string | null,
): Promise<BuiltAlert[]> {
  const fresh: BuiltAlert[] = [];
  for (const a of alerts) {
    let query = supabase
      .from("notification_log")
      .select("id")
      .eq("wpq_id", a.wpqId)
      .eq("alert_type", a.alertType)
      .eq("expiry_date", a.keyDate);

    if (welderId) {
      query = query.eq("welder_id", welderId);
    } else {
      query = query.is("welder_id", null);
    }

    const { data: existing } = await query.maybeSingle();
    if (!existing) fresh.push(a);
  }
  return fresh;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data: orgs } = await supabase.from("organizations").select("*");

  let totalSent = 0;
  let welderEmailsSent = 0;
  const summary: Record<string, number> = {};

  for (const org of orgs ?? []) {
    const leadDays: number[] = org.alert_lead_days?.length
      ? org.alert_lead_days
      : [30, 7];
    const maxLead = Math.max(...leadDays);
    const recipients: string[] = org.alert_emails ?? [];

    const { data: wpqs } = await supabase
      .from("qualification_records")
      .select(
        "id, process, expiry_date, continuity_last_verified, wpq_status, welder_id, revalidation_method",
      )
      .eq("org_id", org.id)
      .eq("wpq_status", "Approved");

    if (!wpqs || wpqs.length === 0) continue;

    const welderIds = Array.from(new Set(wpqs.map((w) => w.welder_id)));
    const { data: welderRows } = await supabase
      .from("welders")
      .select("id, full_name, welder_id, uid, email")
      .in("id", welderIds);
    const welders = new Map((welderRows ?? []).map((w) => [w.id, w]));

    const alerts: BuiltAlert[] = [];

    for (const w of wpqs) {
      const welder = welders.get(w.welder_id);
      if (!welder) continue;

      if (w.expiry_date) {
        const dleft = daysUntil(w.expiry_date);
        if (dleft <= maxLead) {
          const bucket = bucketFor(dleft, leadDays);
          if (bucket) {
            alerts.push({
              welderId: welder.id,
              welderName: welder.full_name,
              plantWelderId: welder.welder_id ?? welder.uid,
              process: processLabel(w.process),
              validityCode: w.revalidation_method ?? "9.3b",
              expiryDate: w.expiry_date,
              daysLeft: dleft,
              wpqId: w.id,
              alertType: `expiry-${bucket}`,
              keyDate: w.expiry_date,
            });
          }
        }
      }

      const due = continuityDue(w.continuity_last_verified);
      if (due) {
        const dleft = daysUntil(due);
        if (dleft <= maxLead) {
          const bucket = bucketFor(dleft, leadDays);
          if (bucket) {
            alerts.push({
              welderId: welder.id,
              welderName: welder.full_name,
              plantWelderId: welder.welder_id ?? welder.uid,
              process: processLabel(w.process),
              validityCode: w.revalidation_method ?? "9.3b",
              expiryDate: due,
              daysLeft: dleft,
              wpqId: w.id,
              alertType: `continuity-${bucket}`,
              keyDate: due,
            });
          }
        }
      }
    }

    if (alerts.length === 0) continue;

    const freshOrg = await filterFreshAlerts(supabase, alerts, null);

    if (freshOrg.length > 0 && recipients.length > 0) {
      const result = await sendExpiryDigest(recipients, org.name, freshOrg);

      for (const a of freshOrg) {
        await supabase.from("notification_log").insert({
          org_id: org.id,
          wpq_id: a.wpqId,
          alert_type: a.alertType,
          expiry_date: a.keyDate,
          channel: "email",
          status: result.sent ? "sent" : "skipped",
        });
      }

      if (result.sent) {
        totalSent += freshOrg.length;
        summary[org.name] = freshOrg.length;
      }
    }

    const alertsByWelder = new Map<string, BuiltAlert[]>();
    for (const a of alerts) {
      const list = alertsByWelder.get(a.welderId) ?? [];
      list.push(a);
      alertsByWelder.set(a.welderId, list);
    }

    for (const [welderId, welderAlerts] of alertsByWelder) {
      const welder = welders.get(welderId);
      const email = welder?.email?.trim();
      if (!email) continue;

      const freshWelder = await filterFreshAlerts(supabase, welderAlerts, welderId);
      if (freshWelder.length === 0) continue;

      const result = await sendWelderExpiryDigest(
        email,
        welder!.full_name,
        org.name,
        freshWelder,
      );

      for (const a of freshWelder) {
        await supabase.from("notification_log").insert({
          org_id: org.id,
          wpq_id: a.wpqId,
          welder_id: welderId,
          alert_type: a.alertType,
          expiry_date: a.keyDate,
          channel: "email",
          status: result.sent ? "sent" : "skipped",
        });
      }

      if (result.sent) welderEmailsSent += 1;
    }
  }

  return NextResponse.json({ ok: true, totalSent, welderEmailsSent, summary });
}
