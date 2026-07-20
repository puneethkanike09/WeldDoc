import Script from "next/script";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { getOrgAccess, readOnlyMessage } from "@/lib/billing/access";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app/app-shell";
import { AppThemeProvider } from "@/components/app/app-theme-provider";
import { ReadOnlyBanner } from "@/components/billing/read-only-banner";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;

const APP_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("welddoc-theme");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-app-theme","dark");}catch(e){}})();`;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, org, email } = await requireSession();
  const userName = profile.full_name || email || "Engineer";
  const access = getOrgAccess(org);

  return (
    <>
      <Script id="welddoc-app-theme" strategy="beforeInteractive">
        {APP_THEME_SCRIPT}
      </Script>
      <Providers>
        <AppThemeProvider>
          <AppShell orgName={org.name} userName={userName}>
            {!access.canWrite && (
              <ReadOnlyBanner message={readOnlyMessage(access)} />
            )}
            {children}
          </AppShell>
        </AppThemeProvider>
      </Providers>
    </>
  );
}
