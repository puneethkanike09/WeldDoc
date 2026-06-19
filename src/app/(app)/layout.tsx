import { requireSession } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app/app-shell";
import { AppThemeProvider } from "@/components/app/app-theme-provider";
import { AppThemeScript } from "@/components/app/app-theme-script";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, org, email } = await requireSession();
  const userName = profile.full_name || email || "Engineer";

  return (
    <>
      <AppThemeScript />
      <Providers>
        <AppThemeProvider>
          <AppShell orgName={org.name} userName={userName}>
            {children}
          </AppShell>
        </AppThemeProvider>
      </Providers>
    </>
  );
}
