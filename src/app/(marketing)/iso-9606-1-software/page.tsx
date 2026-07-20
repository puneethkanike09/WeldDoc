import { SeoContentPage } from "@/components/marketing/seo-content-page";
import { JsonLd } from "@/components/seo/json-ld";
import {
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
} from "@/lib/seo/json-ld";
import { GEO_DEFINITION, GEO_CAPABILITIES } from "@/lib/seo/geo-content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { BRAND_KEYWORDS, DEFAULT_KEYWORDS, SITE_NAME } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "ISO 9606-1 Software — Welder Qualification | Welddoc (Weld.Doc)",
  description:
    "ISO 9606-1 welder qualification software by Welddoc (Weld.Doc). Range of approval, certificate PDFs, continuity tracking, welder registry, and QR verification for ISO 9606-1 fabricators.",
  path: "/iso-9606-1-software",
  keywords: [
    "ISO 9606-1 software",
    "ISO 9606-1 welder qualification software",
    "ISO 9606-1 certificate software",
    "ISO 9606 welder qualification",
    "welder qualification ISO 9606-1",
    ...BRAND_KEYWORDS,
    ...DEFAULT_KEYWORDS.slice(0, 6),
  ],
});

export default function Iso9606SoftwarePage() {
  const jsonLd = [
    softwareApplicationJsonLd(),
    webPageJsonLd({
      path: "/iso-9606-1-software",
      name: "ISO 9606-1 Software — Welddoc (Weld.Doc)",
      description:
        "ISO 9606-1 welder qualification software with range of approval, certificates, and continuity tracking.",
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "ISO 9606-1 software", path: "/iso-9606-1-software" },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <SeoContentPage
        eyebrow="ISO 9606-1"
        title="ISO 9606-1 welder qualification software"
        lead={`${SITE_NAME} (Welddoc) helps welding coordinators manage ISO 9606-1 welder qualifications — from test records and range of approval through certificate issue and continuity.`}
      >
        <p>{GEO_DEFINITION}</p>

        <h2>What ISO 9606-1 teams need from software</h2>
        <p>
          ISO 9606-1 welder qualification is not a one-off certificate in a
          folder. Shops must track processes, positions, material groups,
          thickness ranges, continuity (6-month activity), revalidation, and
          expiry — often across dozens of welders. Welddoc centralises those
          records and generates compliant certificate PDFs with computed range
          of approval.
        </p>

        <h2>How Welddoc supports ISO 9606-1</h2>
        <ul>
          <li>Welder registry with plant IDs and scannable QR status links</li>
          <li>Qualification workflow: plan → test/NDT → certify</li>
          <li>Automatic range-of-approval calculation for ISO 9606-1</li>
          <li>Print-ready welder certificate PDF generation</li>
          <li>Continuity and revalidation expiry email alerts</li>
          <li>Filterable master list with PDF/CSV export for audits</li>
          <li>On-site QR verification without login</li>
        </ul>

        <h2>Also available: ISO 14732 operators</h2>
        <p>
          The same Welddoc platform covers ISO 14732 welding operator
          qualifications alongside ISO 9606-1 welders — one registry, one alert
          system, one verification flow for your QC team.
        </p>

        <h2>Related capabilities</h2>
        <ul>
          {GEO_CAPABILITIES.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SeoContentPage>
    </>
  );
}
