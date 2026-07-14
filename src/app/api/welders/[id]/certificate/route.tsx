import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { resolveUrl, uploadBytes } from "@/lib/storage";
import { resolvePdfImageUrl } from "@/lib/pdf/image-url";
import {
  CertificateDocument,
  type CertificateData,
} from "@/lib/pdf/certificate";
import { buildCertNo } from "@/lib/iso9606/certificate-model";
import { effectiveRangeForWpq } from "@/lib/iso9606/effective-range";
import type {
  NdtDtRecord,
  Organization,
  QualificationRecord,
  RangeOfApproval,
  ValidationRecord,
  Welder,
} from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const wpqId = request.nextUrl.searchParams.get("wpq");
  if (!wpqId) return new Response("Missing wpq", { status: 400 });

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

  const [{ data: org }, { data: welder }, { data: wpq }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase.from("welders").select("*").eq("id", id).single(),
    supabase.from("qualification_records").select("*").eq("id", wpqId).single(),
  ]);

  if (!org || !welder || !wpq || wpq.welder_id !== id || wpq.org_id !== profile.org_id) {
    return new Response("Not found", { status: 404 });
  }

  if ((wpq as QualificationRecord).wpq_status !== "Approved") {
    return new Response("Certificate not yet issued", { status: 403 });
  }

  const [{ data: range }, { data: ndt }, { data: validations }] =
    await Promise.all([
    supabase
      .from("ranges_of_approval")
      .select("*")
      .eq("wpq_id", wpqId)
      .maybeSingle(),
    supabase.from("ndt_dt_records").select("*").eq("wpq_id", wpqId),
    supabase
      .from("validation_records")
      .select("*")
      .eq("wpq_id", wpqId)
      .order("validated_on", { ascending: true }),
  ]);

  const w = welder as Welder;
  const photoUrl = await resolvePdfImageUrl(
    await resolveUrl("welder-photos", w.photo_path),
  );
  const logoUrl = await resolvePdfImageUrl(
    await resolveUrl("org-assets", (org as Organization).logo_path),
  );

  const q = wpq as QualificationRecord;
  const effectiveRange = effectiveRangeForWpq(
    q,
    (range as RangeOfApproval) ?? null,
  );

  const data: CertificateData = {
    org: org as Organization,
    welder: w,
    wpq: q,
    range: effectiveRange,
    ndt: (ndt ?? []) as NdtDtRecord[],
    validations: (validations ?? []) as ValidationRecord[],
    photoUrl,
    logoUrl,
    certNo: buildCertNo(org as Organization, w, wpq as QualificationRecord),
  };

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(<CertificateDocument data={data} />);
  } catch (err) {
    console.error("Certificate PDF render failed:", err);
    return new Response("Failed to generate certificate PDF", { status: 500 });
  }
  const download = request.nextUrl.searchParams.get("download") === "1";

  // Persist a copy to storage (best-effort).
  const path = `${profile.org_id}/${id}/certificate-${wpqId}.pdf`;
  try {
    await uploadBytes("generated-pdfs", path, buffer, "application/pdf");
    const { error: updateError } = await supabase
      .from("qualification_records")
      .update({ certificate_pdf_path: path })
      .eq("id", wpqId);
    if (updateError) {
      console.error("Certificate path update failed:", updateError.message);
    }
  } catch (err) {
    console.error("Certificate PDF upload failed:", err);
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="WPQ-${w.welder_id ?? id}.pdf"`,
    },
  });
}
