import { Landing } from "@/components/marketing/landing";
import { JsonLd } from "@/components/seo/json-ld";
import { homePageJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title:
    "Welder Qualification Software | ISO 9606-1, ISO 14732 & More — Weld.Doc",
  description:
    "Welder qualification software for fabricators and QC teams. Manage WPQ/WPQR records, generate welding certificates, track continuity and expiry, and verify with QR. Live for ISO 9606-1 & ISO 14732; ASME IX and AWS D1.1 coming next.",
  path: "/",
  keywords: [
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
