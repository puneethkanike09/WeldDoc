import { buildLlmsTxt } from "@/lib/seo/geo-content";

export const dynamic = "force-static";

/** https://llmstxt.org — machine-readable summary for AI / answer engines. */
export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
