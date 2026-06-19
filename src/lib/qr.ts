import QRCode from "qrcode";

export type QrStyle = "default" | "light";

const QR_COLORS: Record<
  QrStyle,
  { dark: string; light: string }
> = {
  default: { dark: "#181d26", light: "#ffffff" },
  light: { dark: "#ffffff", light: "#00000000" },
};

export function verifyUrl(token: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/verify/${token}`;
}

export async function qrDataUrl(
  text: string,
  style: QrStyle = "default",
): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: QR_COLORS[style],
  });
}

export async function qrPngBuffer(
  text: string,
  style: QrStyle = "default",
): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: QR_COLORS[style],
  });
}
