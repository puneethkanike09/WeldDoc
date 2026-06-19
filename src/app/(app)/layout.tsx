import { requireSession } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, org, email } = await requireSession();
  const userName = profile.full_name || email || "Engineer";

  return (
    <Providers>
      <AppShell orgName={org.name} userName={userName}>
        {children}
      </AppShell>
    </Providers>
  );
}
