import { Landing } from "@/components/marketing/landing";
import { JsonLd } from "@/components/seo/json-ld";
import { homePageJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Weld.Doc — Welder & Operator Qualification Software",
  description:
    "Purpose-built welder qualification software for ISO 9606-1 and ISO 14732. Generate certificates and ID cards, scan QR codes on site, track continuity and revalidation expiry, and export master lists — built for fabrication shops and welding QC teams in India.",
  path: "/",
  keywords: [
    "welder qualification software",
    "welding qualification management system",
    "ISO 9606-1 certificate generator",
    "ISO 14732 operator qualification software",
    "welder registry QR code",
    "welder certificate PDF",
    "welder ID card software",
    "welder continuity revalidation alerts",
    "welder master list Excel",
    "fabrication QC software India",
    "WPQ WPS welder tracking",
    "on-site welder verification QR",
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
