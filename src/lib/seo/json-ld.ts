import { CONTACT_EMAIL, getSiteUrl, SITE_NAME } from "@/lib/seo/site";

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    logo: `${url}/brand/logo-stacked-light.png`,
    email: CONTACT_EMAIL,
    sameAs: [] as string[],
  };
}

export function webSiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
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
    operatingSystem: "Web",
    url,
    description:
      "Welder and operator qualification management for ISO 9606-1 and ISO 14732 — certificates, QR verification, expiry alerts and master lists.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "Contact for pricing",
    },
    featureList: [
      "Welder registry with plant IDs and QR codes",
      "ISO 9606-1 certificate generation with range of approval",
      "ISO 14732 operator qualification",
      "Wallet ID cards and PDF exports",
      "Continuity and revalidation expiry alerts",
      "Master list and Excel export",
      "Public QR verification without login",
    ],
  };
}

export function homePageJsonLd() {
  return [organizationJsonLd(), webSiteJsonLd(), softwareApplicationJsonLd()];
}
