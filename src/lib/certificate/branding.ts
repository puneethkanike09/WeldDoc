export type CertificateBrandingAlign = "left" | "center" | "right";

export interface CertificateBrandingField {
  enabled: boolean;
  align: CertificateBrandingAlign;
}

export interface CertificateBranding {
  logo: CertificateBrandingField;
  name: CertificateBrandingField;
  location: CertificateBrandingField;
}

export const DEFAULT_CERTIFICATE_BRANDING: CertificateBranding = {
  logo: { enabled: true, align: "center" },
  name: { enabled: true, align: "center" },
  location: { enabled: true, align: "center" },
};

const ALIGNMENTS = new Set<CertificateBrandingAlign>(["left", "center", "right"]);

function parseField(
  raw: unknown,
  fallback: CertificateBrandingField,
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
  };
}

export function parseCertificateBranding(
  raw: unknown,
): CertificateBranding {
  if (!raw || typeof raw !== "object") return DEFAULT_CERTIFICATE_BRANDING;
  const o = raw as Record<string, unknown>;
  return {
    logo: parseField(o.logo, DEFAULT_CERTIFICATE_BRANDING.logo),
    name: parseField(o.name, DEFAULT_CERTIFICATE_BRANDING.name),
    location: parseField(o.location, DEFAULT_CERTIFICATE_BRANDING.location),
  };
}

export function parseCertificateBrandingAlign(
  raw: FormDataEntryValue | null | undefined,
): CertificateBrandingAlign {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "left" || v === "right") return v;
  return "center";
}

export function parseCertificateBrandingFromForm(
  formData: FormData,
): CertificateBranding {
  return {
    logo: {
      enabled: formData.get("cert_brand_logo_enabled") === "1",
      align: parseCertificateBrandingAlign(formData.get("cert_brand_logo_align")),
    },
    name: {
      enabled: formData.get("cert_brand_name_enabled") === "1",
      align: parseCertificateBrandingAlign(formData.get("cert_brand_name_align")),
    },
    location: {
      enabled: formData.get("cert_brand_location_enabled") === "1",
      align: parseCertificateBrandingAlign(
        formData.get("cert_brand_location_align"),
      ),
    },
  };
}

export function certificateLocationText(
  branchLocation: string | null | undefined,
  locationCode: string | null | undefined,
  fallback = "Manufacturing Plant",
): string {
  return branchLocation?.trim() || locationCode?.trim() || fallback;
}

export function operatorCertificateLocationText(
  employerBranch: string | null | undefined,
  locationCode: string | null | undefined,
): string {
  return employerBranch?.trim() || locationCode?.trim() || "";
}
