import { SeoContentPage } from "@/components/marketing/seo-content-page";
import { JsonLd } from "@/components/seo/json-ld";
import {
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
} from "@/lib/seo/json-ld";
import {
  GEO_AUDIENCE,
  GEO_CAPABILITIES,
  GEO_DEFINITION_WITH_STANDARDS,
  GEO_STANDARDS,
} from "@/lib/seo/geo-content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { BRAND_KEYWORDS, DEFAULT_KEYWORDS, SITE_NAME } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "Welder Qualification Software — Welddoc (Weld.Doc)",
  description:
    "Welder qualification software for fabricators and QC teams. Welddoc (Weld.Doc) manages WPQ/WPQR, welding certificates, welder continuity, expiry alerts, and QR verification. ISO 9606-1 & 14732 live.",
  path: "/welder-qualification-software",
  keywords: [
    ...DEFAULT_KEYWORDS,
    ...BRAND_KEYWORDS,
    "best welder qualification software",
    "welder qualification management system",
    "welding qualification tracking software",
  ],
});

export default function WelderQualificationSoftwarePage() {
  const jsonLd = [
    softwareApplicationJsonLd(),
    webPageJsonLd({
      path: "/welder-qualification-software",
      name: "Welder Qualification Software — Welddoc (Weld.Doc)",
      description: GEO_DEFINITION_WITH_STANDARDS,
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      {
        name: "Welder qualification software",
        path: "/welder-qualification-software",
      },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <SeoContentPage
        eyebrow="Welder qualification software"
        title="Welder qualification software built for real fabrication shops"
        lead={`${SITE_NAME} (Welddoc) is purpose-built welder qualification software — not a bloated ERP. Register welders and operators, run qualification workflows, issue certificates, and prove compliance on site.`}
      >
        <p>{GEO_DEFINITION_WITH_STANDARDS}</p>

        <h2>Who uses welder qualification software?</h2>
        <p>{GEO_AUDIENCE}</p>

        <h2>Standards supported today and on the roadmap</h2>
        <ul>
          {GEO_STANDARDS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Core capabilities</h2>
        <ul>
          {GEO_CAPABILITIES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Welddoc vs generic welding ERPs</h2>
        <p>
          Enterprise welding platforms spread qualifications across modules.
          Welddoc keeps WPQ/WPQR records, certificate generation, continuity
          tracking, master lists, and QR verification in one focused product —
          so welding coordinators and QA teams can onboard in an afternoon
          instead of fighting a multi-year ERP rollout.
        </p>

        <h2>Search Welddoc or Weld.Doc</h2>
        <p>
          Whether you search <strong>welder qualification software</strong>,{" "}
          <strong>welddoc</strong>, or <strong>weldoc</strong>, the official
          product is {SITE_NAME} at welddoc.in. Start a free 1-month trial — no
          card required.
        </p>
      </SeoContentPage>
    </>
  );
}
