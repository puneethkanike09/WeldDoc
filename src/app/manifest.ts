import type { MetadataRoute } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#132537",
    theme_color: "#132537",
    lang: "en-IN",
    icons: [
      {
        src: "/brand/icon-light.png",
        sizes: "355x417",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-dark.png",
        sizes: "355x417",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
