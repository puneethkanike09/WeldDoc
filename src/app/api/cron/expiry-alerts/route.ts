import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendExpiryDigest,
  sendWelderExpiryDigest,
  type ExpiryAlert,
} from "@/lib/email";
import { continuityDue } from "@/lib/expiry";
import { operatorContinuityDue } from "@/lib/iso14732/expiry";
import { processLabel as welderProcessLabel } from "@/lib/iso9606/constants";
import { processLabel as operatorProcessLabel } from "@/lib/iso14732/constants";
import {
  bucketFor,
  daysUntil,
  orgDigestKind,
} from "@/lib/expiry-alerts/cron-logic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BuiltAlert = ExpiryAlert & {
  welderId: string;
  wpqId: string;
  alertType: string;
  keyDate: string;
};

type OpAlert = ExpiryAlert & {
  operatorId: string;
  oqId: string;
  alertType: string;
  keyDate: string;
};

async function filterFreshWelderAlerts(
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
      .eq("expiry_date", a.keyDate)
      .eq("status", "sent");

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

async function filterFreshOperatorAlerts(
  supabase: ReturnType<typeof createAdminClient>,
  alerts: OpAlert[],
  operatorId: string | null,
): Promise<OpAlert[]> {
  const fresh: OpAlert[] = [];
  for (const a of alerts) {
    let query = supabase
      .from("notification_log")
      .select("id")
      .eq("operator_qualification_id", a.oqId)
      .eq("alert_type", a.alertType)
      .eq("expiry_date", a.keyDate)
      .eq("status", "sent");

    if (operatorId) {
      query = query.eq("operator_id", operatorId);
    } else {
      query = query.is("operator_id", null);
    }

    const { data: existing } = await query.maybeSingle();
    if (!existing) fresh.push(a);
  }
  return fresh;
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
  const { data: orgs } = await supabase.from("organizations").select("*");

  let totalSent = 0;
  let individualEmailsSent = 0;
  const summary: Record<string, number> = {};

  for (const org of orgs ?? []) {
    const leadDays: number[] = org.alert_lead_days?.length
      ? org.alert_lead_days
      : [30, 7];
    const maxLead = Math.max(...leadDays);
    const recipients: string[] = org.alert_emails ?? [];

    const welderAlerts: BuiltAlert[] = [];
    const welders = new Map<
      string,
      { id: string; full_name: string; welder_id: string | null; uid: string; email: string | null }
    >();

    const { data: wpqs } = await supabase
      .from("qualification_records")
      .select(
        "id, process, expiry_date, continuity_last_verified, wpq_status, welder_id, revalidation_method",
      )
      .eq("org_id", org.id)
      .eq("wpq_status", "Approved");

    if (wpqs && wpqs.length > 0) {
      const welderIds = Array.from(new Set(wpqs.map((w) => w.welder_id)));
      const { data: welderRows } = await supabase
        .from("welders")
        .select("id, full_name, welder_id, uid, email")
        .in("id", welderIds);
      for (const w of welderRows ?? []) {
        welders.set(w.id, w);
      }

      for (const w of wpqs) {
        const welder = welders.get(w.welder_id);
        if (!welder) continue;

        if (w.expiry_date) {
          const dleft = daysUntil(w.expiry_date);
          if (dleft <= maxLead) {
            const bucket = bucketFor(dleft, leadDays);
            if (bucket) {
              welderAlerts.push({
                welderId: welder.id,
                welderName: welder.full_name,
                plantWelderId: welder.welder_id ?? welder.uid,
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
        }

        const due = continuityDue(w.continuity_last_verified);
        if (due) {
          const dleft = daysUntil(due);
          if (dleft <= maxLead) {
            const bucket = bucketFor(dleft, leadDays);
            if (bucket) {
              welderAlerts.push({
                welderId: welder.id,
                welderName: welder.full_name,
                plantWelderId: welder.welder_id ?? welder.uid,
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
    }

    const opAlerts: OpAlert[] = [];
    const operators = new Map<
      string,
      { id: string; full_name: string; operator_id: string | null; uid: string; email: string | null }
    >();

    const { data: oqs } = await supabase
      .from("operator_qualifications")
      .select(
        "id, process, expiry_date, continuity_last_verified, oq_status, operator_id, revalidation_method",
      )
      .eq("org_id", org.id)
      .eq("oq_status", "Approved");

    if (oqs && oqs.length > 0) {
      const operatorIds = Array.from(new Set(oqs.map((o) => o.operator_id)));
      const { data: operatorRows } = await supabase
        .from("operators")
        .select("id, full_name, operator_id, uid, email")
        .in("id", operatorIds);
      for (const o of operatorRows ?? []) {
        operators.set(o.id, o);
      }

      for (const o of oqs) {
        const operator = operators.get(o.operator_id);
        if (!operator) continue;

        if (o.expiry_date) {
          const dleft = daysUntil(o.expiry_date);
          if (dleft <= maxLead) {
            const bucket = bucketFor(dleft, leadDays);
            if (bucket) {
              opAlerts.push({
                operatorId: operator.id,
                welderName: operator.full_name,
                plantWelderId: operator.operator_id ?? operator.uid,
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
        }

        const due = operatorContinuityDue(o.continuity_last_verified);
        if (due) {
          const dleft = daysUntil(due);
          if (dleft <= maxLead) {
            const bucket = bucketFor(dleft, leadDays);
            if (bucket) {
              opAlerts.push({
                operatorId: operator.id,
                welderName: operator.full_name,
                plantWelderId: operator.operator_id ?? operator.uid,
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
    }

    const freshWelderOrg =
      welderAlerts.length > 0
        ? await filterFreshWelderAlerts(supabase, welderAlerts, null)
        : [];
    const freshOperatorOrg =
      opAlerts.length > 0
        ? await filterFreshOperatorAlerts(supabase, opAlerts, null)
        : [];

    const combinedOrgAlerts: ExpiryAlert[] = [
      ...freshWelderOrg,
      ...freshOperatorOrg,
    ];

    if (combinedOrgAlerts.length > 0 && recipients.length > 0) {
      const kind = orgDigestKind(freshWelderOrg.length, freshOperatorOrg.length);
      const result = await sendExpiryDigest(
        recipients,
        org.name,
        combinedOrgAlerts,
        kind,
      );

      if (result.sent) {
        for (const a of freshWelderOrg) {
          await supabase.from("notification_log").insert({
            org_id: org.id,
            wpq_id: a.wpqId,
            alert_type: a.alertType,
            expiry_date: a.keyDate,
            channel: "email",
            status: "sent",
          });
        }
        for (const a of freshOperatorOrg) {
          await supabase.from("notification_log").insert({
            org_id: org.id,
            operator_qualification_id: a.oqId,
            alert_type: a.alertType,
            expiry_date: a.keyDate,
            channel: "email",
            status: "sent",
          });
        }
        totalSent += combinedOrgAlerts.length;
        summary[org.name] = combinedOrgAlerts.length;
      }
    }

    if (welderAlerts.length > 0) {
      const alertsByWelder = new Map<string, BuiltAlert[]>();
      for (const a of welderAlerts) {
        const list = alertsByWelder.get(a.welderId) ?? [];
        list.push(a);
        alertsByWelder.set(a.welderId, list);
      }

      for (const [welderId, items] of alertsByWelder) {
        const welder = welders.get(welderId);
        const email = welder?.email?.trim();
        if (!email) continue;

        const freshWelder = await filterFreshWelderAlerts(
          supabase,
          items,
          welderId,
        );
        if (freshWelder.length === 0) continue;

        const result = await sendWelderExpiryDigest(
          email,
          welder!.full_name,
          org.name,
          freshWelder,
          "welder",
        );

        if (result.sent) {
          for (const a of freshWelder) {
            await supabase.from("notification_log").insert({
              org_id: org.id,
              wpq_id: a.wpqId,
              welder_id: welderId,
              alert_type: a.alertType,
              expiry_date: a.keyDate,
              channel: "email",
              status: "sent",
            });
          }
          individualEmailsSent += 1;
        }
      }
    }

    if (opAlerts.length > 0) {
      const opByOperator = new Map<string, OpAlert[]>();
      for (const a of opAlerts) {
        const list = opByOperator.get(a.operatorId) ?? [];
        list.push(a);
        opByOperator.set(a.operatorId, list);
      }

      for (const [operatorId, items] of opByOperator) {
        const operator = operators.get(operatorId);
        const email = operator?.email?.trim();
        if (!email) continue;

        const freshOp = await filterFreshOperatorAlerts(
          supabase,
          items,
          operatorId,
        );
        if (freshOp.length === 0) continue;

        const result = await sendWelderExpiryDigest(
          email,
          operator!.full_name,
          org.name,
          freshOp,
          "operator",
        );

        if (result.sent) {
          for (const a of freshOp) {
            await supabase.from("notification_log").insert({
              org_id: org.id,
              operator_qualification_id: a.oqId,
              operator_id: operatorId,
              alert_type: a.alertType,
              expiry_date: a.keyDate,
              channel: "email",
              status: "sent",
            });
          }
          individualEmailsSent += 1;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    totalSent,
    individualEmailsSent,
    summary,
  });
}
