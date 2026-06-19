import QRCode from "qrcode";

export function verifyUrl(token: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/verify/${token}`;
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#181d26", light: "#ffffff" },
  });
}

export async function qrPngBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#181d26", light: "#ffffff" },
  });
}
