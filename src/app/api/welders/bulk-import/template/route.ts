import { buildImportTemplateBuffer } from "@/lib/welders/bulk-import/template";

export async function GET() {
  const buffer = buildImportTemplateBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="welddoc-welder-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
