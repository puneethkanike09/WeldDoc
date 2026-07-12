/** Canonical public marketing site — used for metadata, OG, sitemap, JSON-LD. */
export const SITE_NAME = "Weld.Doc";

export const SITE_TAGLINE = "Welder Qualification, Done Right";

export const DEFAULT_DESCRIPTION =
  "Weld.Doc is purpose-built welder and operator qualification software — ISO 9606-1 & ISO 14732 certificates, QR verification, expiry alerts, master lists and dashboards for fabrication shops and QC teams.";

export const DEFAULT_KEYWORDS = [
  "welder qualification software",
  "welding qualification management",
  "ISO 9606-1 certificate software",
  "ISO 14732 operator qualification",
  "welder registry",
  "welder certificate generator",
  "welder ID card QR",
  "welding QC software",
  "welder master list",
  "continuity revalidation tracking",
  "fabrication shop qualification",
  "welder qualification India",
  "WPS WPQ management",
  "welder expiry alerts",
] as const;

export const SITE_LOCALE = "en_IN";

export const TWITTER_HANDLE = "@welddoc";

export const CONTACT_EMAIL = "hello@welddoc.in";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return raw || "https://welddoc.in";
}

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/security", changeFrequency: "monthly" as const, priority: 0.5 },
] as const;
