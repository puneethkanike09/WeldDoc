import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

/** Common AI / answer-engine crawlers — allow public marketing pages for GEO. */
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
  "PerplexityBot",
  "Applebot-Extended",
  "Bytespider",
] as const;

const PUBLIC_ALLOW = ["/", "/privacy", "/terms", "/security", "/llms.txt"];

const APP_DISALLOW = [
  "/dashboard",
  "/welders",
  "/operators",
  "/settings",
  "/masterlist",
  "/login",
  "/verify/",
  "/brochure",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_ALLOW,
        disallow: APP_DISALLOW,
      },
      ...AI_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: PUBLIC_ALLOW,
        disallow: APP_DISALLOW,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

