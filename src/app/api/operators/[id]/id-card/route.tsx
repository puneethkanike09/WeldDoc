import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { resolveUrl } from "@/lib/storage";
import { qrDataUrl, verifyUrl } from "@/lib/qr";
import { buildOperatorIdCardRows } from "@/lib/iso14732/id-card-model";
import { IdCardDocument, type IdCardData } from "@/lib/pdf/id-card";
import { summarizeOperator } from "@/lib/operator-status";
import { idCardRegistryNotice } from "@/lib/registry-status";
import { formatDate } from "@/lib/utils";
import type { Organization, Operator, OperatorQualification } from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile) return new Response("Unauthorized", { status: 401 });

  const [{ data: org }, { data: operator }, { data: oqs }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase.from("operators").select("*").eq("id", id).eq("org_id", profile.org_id).single(),
    supabase.from("operator_qualifications").select("*").eq("operator_id", id),
  ]);

  if (!org || !operator) return new Response("Not found", { status: 404 });

  const o = operator as Operator;
  const qualifications = (oqs ?? []) as OperatorQualification[];
  const rows = buildOperatorIdCardRows(qualifications);
  const summary = summarizeOperator(o, qualifications);
  const statusNotice = idCardRegistryNotice(o.status, "operator");
  const photoUrl = await resolveUrl("welder-photos", o.photo_path);
  const logoUrl = await resolveUrl("org-assets", (org as Organization).logo_path);
  const qr = await qrDataUrl(verifyUrl(o.qr_token, request.nextUrl.origin));
  const plantId = o.operator_id ?? "—";

  const data: IdCardData = {
    org: org as Organization,
    welder: o as unknown as IdCardData["welder"],
    photoUrl,
    logoUrl,
    qrDataUrl: qr,
    welderName: o.full_name,
    welderNo: plantId,
    rows: statusNotice ? [] : rows,
    status: summary.overall,
    statusNotice,
    expiry: statusNotice
      ? null
      : summary.nearestExpiry
        ? formatDate(summary.nearestExpiry)
        : null,
    cardHeading: "OPERATOR ID CARD",
    plantIdLabel: "OPERATOR ID",
    standardLabel: "ISO 14732:2025",
    documentTitle: `Operator ID ${plantId}`,
  };

  const buffer = await renderToBuffer(<IdCardDocument data={data} />);
  const download = request.nextUrl.searchParams.get("download") === "1";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="ID-${plantId}.pdf"`,
    },
  });
}
