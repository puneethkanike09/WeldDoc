import { DsButtonLink } from "@/components/marketing/ds-button";
import { cn } from "@/lib/utils";

type SeoContentPageProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
};

export function SeoContentPage({
  eyebrow,
  title,
  lead,
  children,
  className,
}: SeoContentPageProps) {
  return (
    <main className={cn("pt-28 pb-20", className)}>
      <div className="mx-auto max-w-[800px] px-6">
        <DsButtonLink href="/" variant="secondary" className="mb-6 sm:hidden">
          ← Back to home
        </DsButtonLink>

        <p className="text-mono-label text-brand-red">{eyebrow}</p>
        <h1 className="text-section-heading mt-3 text-balance text-ink">
          {title}
        </h1>
        {lead ? (
          <p className="text-body-large mt-5 text-slate">{lead}</p>
        ) : null}

        <div
          className={cn(
            "mt-12 space-y-8 text-body text-graphite",
            "[&_h2]:text-feature-heading [&_h2]:text-ink [&_h2]:mt-10 [&_h2:first-child]:mt-0",
            "[&_p]:leading-relaxed",
            "[&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-0 [&_ul]:list-none",
            "[&_li]:flex [&_li]:gap-2 [&_li]:before:content-['·'] [&_li]:before:text-brand-red",
          )}
        >
          {children}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-hairline pt-10">
          <DsButtonLink href="/login">Start free trial</DsButtonLink>
          <DsButtonLink href="/" variant="secondary">
            ← Back to home
          </DsButtonLink>
        </div>
      </div>
    </main>
  );
}
