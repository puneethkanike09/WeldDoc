import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  getMasterListRows,
  MASTER_COLUMNS,
  type MasterRow,
} from "@/lib/masterlist";
import {
  getPedMasterListRows,
  PED_MASTER_COLUMNS,
  type PedMasterRow,
} from "@/lib/masterlist-ped";
import { MasterListDocument } from "@/lib/pdf/masterlist";
import { PedMasterListDocument } from "@/lib/pdf/masterlist-ped";
import { resolveUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

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

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_path")
    .eq("id", profile.org_id)
    .single();

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "ped-pdf") {
    const pedRows = await getPedMasterListRows(supabase, profile.org_id);
    const logoUrl = org?.logo_path
      ? await resolveUrl("org-assets", org.logo_path)
      : null;
    const buffer = await renderToBuffer(
      <PedMasterListDocument
        rows={pedRows}
        orgName={org?.name ?? "WeldDoc"}
        logoUrl={logoUrl}
        asOnDate={stamp}
      />,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ped-qualified-welders-${stamp}.pdf"`,
      },
    });
  }

  if (format === "ped-csv") {
    const pedRows = await getPedMasterListRows(supabase, profile.org_id);
    const header = PED_MASTER_COLUMNS.map((c) => csvEscape(c.label)).join(",");
    const body = pedRows
      .map((r) =>
        PED_MASTER_COLUMNS.map((c) =>
          csvEscape(String(r[c.key as keyof PedMasterRow] ?? "")),
        ).join(","),
      )
      .join("\n");
    const csv = `\uFEFF${header}\n${body}`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ped-qualified-welders-${stamp}.csv"`,
      },
    });
  }

  const rows = await getMasterListRows(supabase, profile.org_id);

  if (format === "pdf") {
    const buffer = await renderToBuffer(
      <MasterListDocument rows={rows} orgName={org?.name ?? "WeldDoc"} />,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="welder-master-list-${stamp}.pdf"`,
      },
    });
  }

  const header = MASTER_COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((r) =>
      MASTER_COLUMNS.map((c) => csvEscape(String(r[c.key as keyof MasterRow] ?? ""))).join(
        ",",
      ),
    )
    .join("\n");
  const csv = `\uFEFF${header}\n${body}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="welder-master-list-${stamp}.csv"`,
    },
  });
}
