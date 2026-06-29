import { buildOperatorImportTemplateBuffer } from "@/lib/operators/bulk-import/template";

export const runtime = "nodejs";

export async function GET() {
  const buffer = buildOperatorImportTemplateBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="welddoc-operator-import-template.xlsx"',
    },
  });
}
