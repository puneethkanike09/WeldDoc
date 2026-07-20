import {
  BRAND_ALTERNATE_NAMES,
  CONTACT_EMAIL,
  getSiteUrl,
  SITE_DOMAIN,
  SITE_NAME,
  TWITTER_URL,
} from "@/lib/seo/site";
import {
  GEO_DEFINITION,
  GEO_DEFINITION_WITH_STANDARDS,
  GEO_FAQS,
  GEO_ONE_LINER,
} from "@/lib/seo/geo-content";

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url,
    logo: `${url}/brand/logo-stacked-light.png`,
    email: CONTACT_EMAIL,
    description: GEO_ONE_LINER,
    sameAs: [url, TWITTER_URL, `https://${SITE_DOMAIN}`],
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "sales",
      availableLanguage: ["English"],
    },
  };
}

export function webSiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url,
    description: GEO_ONE_LINER,
    publisher: { "@type": "Organization", name: SITE_NAME, url },
    inLanguage: "en-IN",
  };
}

export function softwareApplicationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Welder qualification software",
    operatingSystem: "Web",
    url,
    description: GEO_DEFINITION_WITH_STANDARDS,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "Contact for pricing",
    },
    featureList: [
      "Welder and operator qualification registry",
      "ISO 9606-1 welder certification and certificate generation (available now)",
      "ISO 14732 operator qualification software (available now)",
      "ASME Section IX and AWS D1.1 on the product roadmap",
      "WPS, WPQ and WPQR record management",
      "Welder continuity tracking and expiry alerts",
      "Welding traceability with QR verification",
      "Master list and CSV export for compliance audits",
    ],
    audience: {
      "@type": "Audience",
      audienceType:
        "Fabrication shops, welding coordinators, QA/QC and compliance teams",
    },
  };
}

export function faqPageJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GEO_FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
    url,
  };
}

/** WebPage with speakable cues — helps answer engines extract the definition. */
export function homeWebPageJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} — Welder Qualification Software (Welddoc)`,
    url,
    description: GEO_ONE_LINER,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url },
    about: {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      alternateName: [...BRAND_ALTERNATE_NAMES],
      description: GEO_DEFINITION_WITH_STANDARDS,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#geo-definition", "#faq", "#brand-aliases"],
    },
    inLanguage: "en-IN",
  };
}

export function homePageJsonLd() {
  return [
    organizationJsonLd(),
    webSiteJsonLd(),
    softwareApplicationJsonLd(),
    homeWebPageJsonLd(),
    faqPageJsonLd(),
  ];
}

export function webPageJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  const url = `${getSiteUrl()}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url,
    description,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: getSiteUrl() },
    about: {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      alternateName: [...BRAND_ALTERNATE_NAMES],
    },
    inLanguage: "en-IN",
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? siteUrl : `${siteUrl}${item.path}`,
    })),
  };
}
