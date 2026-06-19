import { requireSession } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/app/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, org, email } = await requireSession();
  const userName = profile.full_name || email || "Engineer";

  return (
    <Providers>
      <div className="flex min-h-screen bg-parchment">
        <Sidebar orgName={org.name} userName={userName} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </Providers>
  );
}
