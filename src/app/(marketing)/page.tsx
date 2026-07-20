import { Landing } from "@/components/marketing/landing";
import { JsonLd } from "@/components/seo/json-ld";
import { homePageJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title:
    "Welddoc (Weld.Doc) | Welder Qualification Software — ISO 9606-1, ISO 14732",
  description:
    "Welddoc (Weld.Doc) — official welder qualification software at welddoc.in. Also searched as Weldoc or weld doc. WPQ/WPQR records, welding certificates, continuity tracking, QR verification. ISO 9606-1 & 14732 live.",
  path: "/",
  keywords: [
    "welddoc",
    "Welddoc",
    "weldoc",
    "Weldoc",
    "WeldDoc",
    "weld doc",
    "welddoc.in",
    "Weld.Doc",
    "welder qualification software",
    "welder certification software",
    "welding documentation software",
    "welding compliance software",
    "WPS software",
    "WPQR software",
    "WPQ software",
    "welder continuity tracking",
    "welding certificate generation",
    "ISO 9606-1 software",
    "ISO 14732 software",
    "ASME Section IX welder qualification",
    "AWS D1.1 welder qualification software",
    "welding traceability software",
    "welding management software",
    "online welder certification management",
    "digital welding documentation for fabrication teams",
  ],
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={homePageJsonLd()} />
      <Landing />
    </>
  );
}
