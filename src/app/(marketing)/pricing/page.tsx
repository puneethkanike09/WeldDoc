import { PricingSection } from "@/components/marketing/pricing-section";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { BRAND_KEYWORDS, DEFAULT_KEYWORDS } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "Welddoc Pricing — Weld.Doc Plans & Free Trial",
  description:
    "Welddoc (Weld.Doc) pricing for welder qualification software. Free 1-month Starter trial, Growth and Enterprise plans for fabrication shops. Official plans at welddoc.in.",
  path: "/pricing",
  keywords: [
    ...BRAND_KEYWORDS,
    "welddoc pricing",
    "weldoc pricing",
    "welder qualification software pricing",
    "welding software price India",
    ...DEFAULT_KEYWORDS.slice(0, 8),
  ],
});

export default function PricingPage() {
  const jsonLd = [
    webPageJsonLd({
      path: "/pricing",
      name: "Welddoc Pricing — Weld.Doc Plans",
      description:
        "Pricing for Welddoc (Weld.Doc) welder qualification software including free trial and paid plans.",
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pricing", path: "/pricing" },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="pt-28 pb-32">
        <div className="mx-auto max-w-[1280px] px-6">
          <h1 className="sr-only">Welddoc (Weld.Doc) pricing — welder qualification software plans</h1>
        </div>
        <PricingSection className="section-y bg-canvas pb-0 pt-0" />
      </main>
    </>
  );
}
