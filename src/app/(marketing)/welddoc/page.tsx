import { SeoContentPage } from "@/components/marketing/seo-content-page";
import { JsonLd } from "@/components/seo/json-ld";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
} from "@/lib/seo/json-ld";
import {
  GEO_BRAND_ALIASES,
  GEO_CAPABILITIES,
  GEO_DEFINITION_WITH_STANDARDS,
} from "@/lib/seo/geo-content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { BRAND_KEYWORDS, SITE_DOMAIN, SITE_NAME } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "Welddoc — Official Weld.Doc Welder Qualification Software",
  description:
    "Welddoc is Weld.Doc — official welder qualification software at welddoc.in. Also searched as Weldoc or weld doc. ISO 9606-1 & 14732 certificates, continuity tracking, QR verification.",
  path: "/welddoc",
  keywords: [
    ...BRAND_KEYWORDS,
    "official welddoc site",
    "welddoc app",
    "weldoc app",
    "weld doc software",
  ],
});

export default function WelddocBrandPage() {
  const jsonLd = [
    organizationJsonLd(),
    softwareApplicationJsonLd(),
    webPageJsonLd({
      path: "/welddoc",
      name: `Welddoc — Official ${SITE_NAME} Site`,
      description: GEO_DEFINITION_WITH_STANDARDS,
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Welddoc", path: "/welddoc" },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <SeoContentPage
        eyebrow="Official brand"
        title="Welddoc is Weld.Doc — the official welder qualification software"
        lead={`If you searched for Welddoc, Weldoc, or ${SITE_DOMAIN}, you are in the right place. ${SITE_NAME} is the same product.`}
      >
        <p id="brand-aliases">{GEO_BRAND_ALIASES}</p>

        <h2>What is Welddoc?</h2>
        <p>{GEO_DEFINITION_WITH_STANDARDS}</p>

        <h2>Why people search Welddoc or Weldoc</h2>
        <p>
          Many teams type <strong>welddoc</strong> or <strong>weldoc</strong>{" "}
          because the domain is {SITE_DOMAIN} and the brand is spoken as one
          word. The official product name is {SITE_NAME} with a dot — but search
          engines and answer engines treat Welddoc, Weldoc, and Weld Doc as the
          same software category: welder qualification software for fabrication
          and QC teams.
        </p>

        <h2>What you get with Welddoc (Weld.Doc)</h2>
        <ul>
          {GEO_CAPABILITIES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Official website</h2>
        <p>
          The only official Welddoc website is {SITE_DOMAIN}. Start a free
          trial from the home page or sign in if your organisation already uses
          the product.
        </p>
      </SeoContentPage>
    </>
  );
}
