import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  getOperatorMasterListRows,
  OPERATOR_MASTER_COLUMNS,
  type OperatorMasterRow,
} from "@/lib/operator-masterlist";
import { OperatorMasterListDocument } from "@/lib/pdf/operator-masterlist";

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
  const rows = await getOperatorMasterListRows(supabase, profile.org_id);

  if (format === "pdf") {
    const buffer = await renderToBuffer(
      <OperatorMasterListDocument rows={rows} orgName={org?.name ?? "Organisation"} />,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="operator-master-list-${stamp}.pdf"`,
      },
    });
  }

  const header = OPERATOR_MASTER_COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((r) =>
      OPERATOR_MASTER_COLUMNS.map((c) =>
        csvEscape(String(r[c.key as keyof OperatorMasterRow] ?? "")),
      ).join(","),
    )
    .join("\n");
  const csv = `\uFEFF${header}\n${body}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="operator-master-list-${stamp}.csv"`,
    },
  });
}
