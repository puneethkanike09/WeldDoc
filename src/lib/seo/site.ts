/** Canonical public marketing site — used for metadata, OG, sitemap, JSON-LD. */
export const SITE_NAME = "Weld.Doc";

export const SITE_TAGLINE =
  "Welder Qualification Software — ISO today, more standards ahead";

export const DEFAULT_DESCRIPTION =
  "Weld.Doc is welder qualification software and welding documentation software for fabrication teams — certificates, WPS/WPQ/WPQR records, welder continuity tracking, QR verification, expiry alerts, and master lists. Available now for ISO 9606-1 and ISO 14732; ASME Section IX and AWS D1.1 on the roadmap.";

/** High-intent B2B keywords (titles/meta/JSON-LD). Visible copy still reads naturally. */
export const DEFAULT_KEYWORDS = [
  "welder qualification software",
  "welder certification software",
  "welding qualification software",
  "welding documentation software",
  "welding management software",
  "welding compliance software",
  "WPS software",
  "WPQR software",
  "WPQ software",
  "welder continuity tracking",
  "welding record management",
  "welding certificate generation",
  "ISO 9606-1 software",
  "ISO 14732 software",
  "ASME Section IX welder qualification software",
  "AWS D1.1 welder qualification software",
  "welding traceability software",
  "fabrication quality management software",
  "software for welder qualification records",
  "online welder certification management",
  "digital welding documentation for fabrication teams",
  "manage welder continuity and expiry dates",
  "cloud software for welding records and certificates",
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
  { path: "/llms.txt", changeFrequency: "monthly" as const, priority: 0.3 },
] as const;
