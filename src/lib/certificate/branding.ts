export type CertificateBrandingAlign = "left" | "center" | "right";

export interface CertificateBrandingField {
  enabled: boolean;
  align: CertificateBrandingAlign;
  sizePx: number;
}

export interface CertificateBranding {
  logo: CertificateBrandingField;
  name: CertificateBrandingField;
}

export const DEFAULT_LOGO_SIZE_PX = 28;
export const DEFAULT_NAME_SIZE_PX = 13;
export const MIN_LOGO_SIZE_PX = 16;
export const MAX_LOGO_SIZE_PX = 80;
export const MIN_NAME_SIZE_PX = 8;
export const MAX_NAME_SIZE_PX = 24;

export const DEFAULT_CERTIFICATE_BRANDING: CertificateBranding = {
  logo: { enabled: true, align: "center", sizePx: DEFAULT_LOGO_SIZE_PX },
  name: { enabled: true, align: "center", sizePx: DEFAULT_NAME_SIZE_PX },
};

const ALIGNMENTS = new Set<CertificateBrandingAlign>(["left", "center", "right"]);

function clampSizePx(
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? parseInt(raw.trim(), 10)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseField(
  raw: unknown,
  fallback: CertificateBrandingField,
  minSizePx: number,
  maxSizePx: number,
): CertificateBrandingField {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const align = o.align;
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : fallback.enabled,
    align:
      typeof align === "string" && ALIGNMENTS.has(align as CertificateBrandingAlign)
        ? (align as CertificateBrandingAlign)
        : fallback.align,
    sizePx: clampSizePx(o.sizePx, fallback.sizePx, minSizePx, maxSizePx),
  };
}

export function parseCertificateBranding(
  raw: unknown,
): CertificateBranding {
  if (!raw || typeof raw !== "object") return DEFAULT_CERTIFICATE_BRANDING;
  const o = raw as Record<string, unknown>;
  return {
    logo: parseField(
      o.logo,
      DEFAULT_CERTIFICATE_BRANDING.logo,
      MIN_LOGO_SIZE_PX,
      MAX_LOGO_SIZE_PX,
    ),
    name: parseField(
      o.name,
      DEFAULT_CERTIFICATE_BRANDING.name,
      MIN_NAME_SIZE_PX,
      MAX_NAME_SIZE_PX,
    ),
  };
}

export function parseCertificateBrandingAlign(
  raw: FormDataEntryValue | null | undefined,
): CertificateBrandingAlign {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "left" || v === "right") return v;
  return "center";
}

function parseSizePxFromForm(
  formData: FormData,
  field: "logo" | "name",
  fallback: number,
  min: number,
  max: number,
): number {
  return clampSizePx(
    formData.get(`cert_brand_${field}_size_px`),
    fallback,
    min,
    max,
  );
}

export function parseCertificateBrandingFromForm(
  formData: FormData,
): CertificateBranding {
  return {
    logo: {
      enabled: formData.get("cert_brand_logo_enabled") === "1",
      align: parseCertificateBrandingAlign(formData.get("cert_brand_logo_align")),
      sizePx: parseSizePxFromForm(
        formData,
        "logo",
        DEFAULT_LOGO_SIZE_PX,
        MIN_LOGO_SIZE_PX,
        MAX_LOGO_SIZE_PX,
      ),
    },
    name: {
      enabled: formData.get("cert_brand_name_enabled") === "1",
      align: parseCertificateBrandingAlign(formData.get("cert_brand_name_align")),
      sizePx: parseSizePxFromForm(
        formData,
        "name",
        DEFAULT_NAME_SIZE_PX,
        MIN_NAME_SIZE_PX,
        MAX_NAME_SIZE_PX,
      ),
    },
  };
}
