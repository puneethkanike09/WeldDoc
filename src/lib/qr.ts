import QRCode from "qrcode";

export const QR_PRINT_COLORS = [
  { id: "black", label: "Black", swatch: "#161616" },
  { id: "navy", label: "Navy", swatch: "#1b3a6b" },
  { id: "forest", label: "Forest", swatch: "#214224" },
  { id: "burgundy", label: "Burgundy", swatch: "#6b2d2d" },
] as const;

export type QrPrintColor = (typeof QR_PRINT_COLORS)[number]["id"];
export type QrStyle = QrPrintColor | "light";

const QR_COLORS: Record<QrStyle, { dark: string; light: string }> = {
  black: { dark: "#161616", light: "#ffffff" },
  navy: { dark: "#1b3a6b", light: "#ffffff" },
  forest: { dark: "#214224", light: "#ffffff" },
  burgundy: { dark: "#6b2d2d", light: "#ffffff" },
  light: { dark: "#ffffff", light: "#00000000" },
};

export function parseQrStyle(value: string | null | undefined): QrStyle {
  if (value === "light") return "light";
  if (value === "default" || value === "black") return "black";
  if (QR_PRINT_COLORS.some((c) => c.id === value)) return value as QrPrintColor;
  return "black";
}

export function qrColorHex(style: QrPrintColor): string {
  return QR_COLORS[style].dark;
}

/** Public verify links always point at production — never request origin (breaks behind Docker/nginx). */
export function verifyUrl(token: string): string {
  return `https://welddoc.in/verify/${token}`;
}

export async function qrDataUrl(
  text: string,
  style: QrStyle = "black",
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
  style: QrStyle = "black",
): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: QR_COLORS[style],
  });
}

export function qrImageUrl(token: string, color: QrPrintColor = "black"): string {
  return `/api/qr/${token}?color=${color}`;
}
