import { DsButtonLink } from "@/components/marketing/ds-button";
import { LegalNavLinks } from "@/components/marketing/legal-nav-links";
import type { LegalPath } from "@/components/marketing/legal-nav-links";
import { cn } from "@/lib/utils";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  active: LegalPath;
  children: React.ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  active,
  children,
}: LegalPageProps) {
  return (
    <main className="pt-28 pb-20">
      <div className="mx-auto max-w-[720px] px-6">
        <DsButtonLink href="/" variant="secondary" className="mb-6 sm:hidden">
          ← Back to home
        </DsButtonLink>
        <LegalNavLinks active={active} className="mb-8 md:hidden" />

        <p className="text-mono-label text-coral">{eyebrow}</p>
        <h1 className="text-section-heading mt-3 text-ink">{title}</h1>
        <p className="text-caption mt-4 text-muted-slate">
          Last updated: {lastUpdated}
        </p>

        <div
          className={cn(
            "mt-12 space-y-10 text-body text-graphite",
            "[&_h2]:text-feature-heading [&_h2]:text-ink [&_h2]:mt-0",
            "[&_p]:leading-relaxed",
            "[&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-0 [&_ul]:list-none",
            "[&_li]:flex [&_li]:gap-2 [&_li]:before:content-['·'] [&_li]:before:text-coral",
          )}
        >
          {children}
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-black/8 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-micro text-muted-slate">
            Weld.Doc © {new Date().getFullYear()}
          </p>
          <DsButtonLink href="/" variant="secondary">
            ← Back to home
          </DsButtonLink>
        </div>
      </div>
    </main>
  );
}
