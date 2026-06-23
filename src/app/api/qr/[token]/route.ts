import { NextRequest } from "next/server";
import { qrPngBuffer, verifyUrl, parseQrStyle } from "@/lib/qr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = request.nextUrl.origin;
  const style = parseQrStyle(
    request.nextUrl.searchParams.get("color") ??
      request.nextUrl.searchParams.get("style"),
  );
  const png = await qrPngBuffer(verifyUrl(token, origin), style);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
