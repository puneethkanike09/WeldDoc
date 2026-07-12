import Script from "next/script";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { AppThemeProvider } from "@/components/app/app-theme-provider";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;

const APP_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("welddoc-theme");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-app-theme","dark");}catch(e){}})();`;

/** Printable ID card — authenticated, no app sidebar. */
export default async function IdCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <>
      <Script id="welddoc-app-theme" strategy="beforeInteractive">
        {APP_THEME_SCRIPT}
      </Script>
      <Providers>
        <AppThemeProvider>{children}</AppThemeProvider>
      </Providers>
    </>
  );
}
