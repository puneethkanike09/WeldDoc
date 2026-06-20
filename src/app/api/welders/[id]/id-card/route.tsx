import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { resolveUrl } from "@/lib/storage";
import { qrDataUrl, verifyUrl } from "@/lib/qr";
import { IdCardDocument, type IdCardData } from "@/lib/pdf/id-card";
import { summarizeWelder } from "@/lib/welder-status";
import { formatDate } from "@/lib/utils";
import type {
  Organization,
  QualificationRecord,
  Welder,
} from "@/types/db";

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

  const [{ data: org }, { data: welder }, { data: wpqs }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase.from("welders").select("*").eq("id", id).single(),
    supabase.from("qualification_records").select("*").eq("welder_id", id),
  ]);

  if (!org || !welder) return new Response("Not found", { status: 404 });

  const w = welder as Welder;
  const qualifications = (wpqs ?? []) as QualificationRecord[];
  const summary = summarizeWelder(w, qualifications);
  const photoUrl = await resolveUrl("welder-photos", w.photo_path);
  const logoUrl = await resolveUrl("org-assets", (org as Organization).logo_path);
  const verify = verifyUrl(w.qr_token, request.nextUrl.origin);
  const qr = await qrDataUrl(verify);

  const data: IdCardData = {
    org: org as Organization,
    welder: w,
    qrDataUrl: qr,
    photoUrl,
    logoUrl,
    verifyUrl: verify,
    processes: summary.processes,
    status: summary.overall,
    expiry: summary.nearestExpiry ? formatDate(summary.nearestExpiry) : null,
  };

  const buffer = await renderToBuffer(<IdCardDocument data={data} />);
  const download = request.nextUrl.searchParams.get("download") === "1";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="ID-${w.uid}.pdf"`,
    },
  });
}
