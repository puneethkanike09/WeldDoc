import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  getOperatorMasterListRows,
  formatOperatorMasterRowExport,
  operatorMasterListColumnDefs,
} from "@/lib/operator-masterlist";
import {
  filterOperatorMasterRows,
  parseOperatorMasterListFilters,
} from "@/lib/masterlist/filter-operator-rows";
import { OperatorMasterListDocument } from "@/lib/pdf/operator-masterlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const filters = parseOperatorMasterListFilters({
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    weldingType: request.nextUrl.searchParams.get("weldingType") ?? undefined,
  });

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
    .select("name, masterlist_columns")
    .eq("id", profile.org_id)
    .single();

  const stamp = new Date().toISOString().slice(0, 10);
  const allRows = await getOperatorMasterListRows(supabase, profile.org_id);
  const rows = filterOperatorMasterRows(allRows, filters);
  const columns = operatorMasterListColumnDefs(org?.masterlist_columns ?? null);

  if (format === "pdf") {
    const buffer = await renderToBuffer(
      <OperatorMasterListDocument
        rows={rows}
        columns={columns}
        orgName={org?.name ?? "Organisation"}
      />,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="operator-master-list-${stamp}.pdf"`,
      },
    });
  }

  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((r, i) =>
      columns
        .map((c) => csvEscape(formatOperatorMasterRowExport(c.key, r, i + 1)))
        .join(","),
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
