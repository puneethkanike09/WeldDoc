import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  getMasterListRows,
  MASTER_COLUMNS,
  type MasterRow,
} from "@/lib/masterlist";
import { MasterListDocument } from "@/lib/pdf/masterlist";

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
    .select("name")
    .eq("id", profile.org_id)
    .single();

  const stamp = new Date().toISOString().slice(0, 10);
  const rows = await getMasterListRows(supabase, profile.org_id);

  if (format === "pdf") {
    const buffer = await renderToBuffer(
      <MasterListDocument rows={rows} orgName={org?.name ?? "Organisation"} />,
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
