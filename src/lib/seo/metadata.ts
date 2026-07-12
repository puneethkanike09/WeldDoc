import type { Metadata } from "next";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  getSiteUrl,
  SITE_LOCALE,
  SITE_NAME,
  TWITTER_HANDLE,
} from "@/lib/seo/site";

export type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  /** Default true for marketing pages */
  index?: boolean;
  ogImageAlt?: string;
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords = [...DEFAULT_KEYWORDS],
  index = true,
  ogImageAlt,
}: PageSeoInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = path === "/" ? siteUrl : `${siteUrl}${path}`;
  const fullTitle = path === "/" ? title : `${title} · ${SITE_NAME}`;
  const imageAlt = ogImageAlt ?? `${SITE_NAME} — ${title}`;

  return {
    title: path === "/" ? title : title,
    description,
    keywords,
    alternates: { canonical },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: fullTitle,
      description,
      images: ["/twitter-image"],
    },
  };
}

export function rootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    applicationName: SITE_NAME,
    title: {
      default: `${SITE_NAME} — Welder & Operator Qualification Software`,
      template: `%s · ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [...DEFAULT_KEYWORDS],
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: { email: false, address: false, telephone: false },
    icons: {
      icon: [
        { url: "/brand/icon-light.png", type: "image/png", sizes: "355x417" },
        { url: "/brand/icon-dark.png", type: "image/png", sizes: "355x417" },
      ],
      apple: [{ url: "/brand/icon-light.png", sizes: "180x180", type: "image/png" }],
      shortcut: ["/brand/icon-light.png"],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Welder & Operator Qualification Software`,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ISO 9606-1 & ISO 14732 qualification platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: `${SITE_NAME} — Welder Qualification Software`,
      description: DEFAULT_DESCRIPTION,
      images: ["/twitter-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
  };
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};
