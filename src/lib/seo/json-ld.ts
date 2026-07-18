import { CONTACT_EMAIL, getSiteUrl, SITE_NAME } from "@/lib/seo/site";
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
    alternateName: ["WeldDoc", "Weld Doc"],
    url,
    logo: `${url}/brand/logo-stacked-light.png`,
    email: CONTACT_EMAIL,
    description: GEO_ONE_LINER,
    sameAs: [] as string[],
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
    name: `${SITE_NAME} — Welder Qualification Software`,
    url,
    description: GEO_ONE_LINER,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url },
    about: {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      description: GEO_DEFINITION_WITH_STANDARDS,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#geo-definition", "#faq"],
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
