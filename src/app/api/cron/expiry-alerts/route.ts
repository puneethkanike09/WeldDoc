import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendExpiryDigest, type ExpiryAlert } from "@/lib/email";
import { continuityDue } from "@/lib/expiry";
import { processLabel } from "@/lib/iso9606/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 1000 * 60 * 60 * 24;

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
      .select("id, full_name, welder_id, uid")
      .in("id", welderIds);
    const welders = new Map(
      (welderRows ?? []).map((w) => [w.id, w]),
    );

    const alerts: (ExpiryAlert & {
      wpqId: string;
      alertType: string;
      keyDate: string;
    })[] = [];

    for (const w of wpqs) {
      const welder = welders.get(w.welder_id);
      if (!welder) continue;

      // Expiry reminders.
      if (w.expiry_date) {
        const dleft = daysUntil(w.expiry_date);
        if (dleft <= maxLead) {
          const bucket = bucketFor(dleft, leadDays);
          if (bucket) {
            alerts.push({
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

      // Continuity (9.2) reminders.
      const due = continuityDue(w.continuity_last_verified);
      if (due) {
        const dleft = daysUntil(due);
        if (dleft <= maxLead) {
          const bucket = bucketFor(dleft, leadDays);
          if (bucket) {
            alerts.push({
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

    // Dedupe against notification_log.
    const fresh: typeof alerts = [];
    for (const a of alerts) {
      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("wpq_id", a.wpqId)
        .eq("alert_type", a.alertType)
        .eq("expiry_date", a.keyDate)
        .maybeSingle();
      if (!existing) fresh.push(a);
    }

    if (fresh.length === 0) continue;

    const result = await sendExpiryDigest(recipients, org.name, fresh);

    for (const a of fresh) {
      await supabase.from("notification_log").insert({
        org_id: org.id,
        wpq_id: a.wpqId,
        alert_type: a.alertType,
        expiry_date: a.keyDate,
        channel: "email",
        status: result.sent ? "sent" : "skipped",
      });
    }

    if (result.sent) totalSent += fresh.length;
    summary[org.name] = fresh.length;
  }

  return NextResponse.json({ ok: true, totalSent, summary });
}
