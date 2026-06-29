import { NextRequest } from "next/server";

import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";

import { resolveUrl } from "@/lib/storage";

import { OperatorCertificateDocument } from "@/lib/pdf/operator-certificate";

import type {

  Operator,

  OperatorQualification,

  OperatorRange,

  Organization,

} from "@/types/db";



export const runtime = "nodejs";

export const dynamic = "force-dynamic";



export async function GET(

  request: NextRequest,

  { params }: { params: Promise<{ id: string }> },

) {

  const { id } = await params;

  const oqId = request.nextUrl.searchParams.get("oq");

  if (!oqId) return new Response("Missing oq", { status: 400 });



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



  const [{ data: org }, { data: operator }, { data: oq }] = await Promise.all([

    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),

    supabase.from("operators").select("*").eq("id", id).single(),

    supabase.from("operator_qualifications").select("*").eq("id", oqId).single(),

  ]);



  if (!org || !operator || !oq || oq.operator_id !== id || oq.org_id !== profile.org_id) {

    return new Response("Not found", { status: 404 });

  }



  const allowPreview =

    (oq as OperatorQualification).oq_status === "Approved" ||

    (oq as OperatorQualification).oq_status === "Pending_NDT";

  if (!allowPreview) {

    return new Response("Complete qualification first", { status: 403 });

  }



  const { data: range } = await supabase

    .from("operator_ranges")

    .select("*")

    .eq("oq_id", oqId)

    .maybeSingle();



  const op = operator as Operator;

  const photoUrl = await resolveUrl("welder-photos", op.photo_path);

  const certNo = `OQ-${(oq as OperatorQualification).id.slice(0, 8).toUpperCase()}`;



  const buffer = await renderToBuffer(

    <OperatorCertificateDocument

      data={{

        org: org as Organization,

        operator: op,

        oq: oq as OperatorQualification,

        range: (range as OperatorRange | null) ?? null,

        certNo,

        photoUrl,

      }}

    />,

  );



  const download = request.nextUrl.searchParams.get("download") === "1";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="operator-certificate-${certNo}.pdf"`,
    },
  });

}

