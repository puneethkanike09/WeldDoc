import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/billing/superadmin";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-panel">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-semibold text-onyx">
              Weld.Doc
            </span>
            <span className="rounded-full bg-frost px-2.5 py-0.5 text-xs font-medium text-charcoal">
              Superadmin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-graphite">
            <span>{email}</span>
            <Link href="/dashboard" className="underline underline-offset-4">
              Back to app
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-6 py-8">{children}</main>
    </div>
  );
}
