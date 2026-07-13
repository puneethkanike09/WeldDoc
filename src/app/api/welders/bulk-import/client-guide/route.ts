import { buildClientDateGuideBuffer } from "@/lib/welders/bulk-import/client-date-guide";

export async function GET() {
  const buffer = buildClientDateGuideBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="welddoc-client-import-date-guide.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
