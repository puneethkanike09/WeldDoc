import { NextRequest } from "next/server";
import { qrPngBuffer, verifyUrl, type QrStyle } from "@/lib/qr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = request.nextUrl.origin;
  const style = (request.nextUrl.searchParams.get("style") ??
    "default") as QrStyle;
  const png = await qrPngBuffer(
    verifyUrl(token, origin),
    style === "light" ? "light" : "default",
  );

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
