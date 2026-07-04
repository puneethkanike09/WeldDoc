"use client";

import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";
import {
  WELDING_STANDARDS_CATALOG,
  standardPdfApiPath,
  type StandardCatalogEntry,
} from "@/lib/standards/catalog";

function greeting(firstName: string): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${part}, ${firstName}`;
}

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-silver bg-panel text-graphite transition-colors hover:bg-frost hover:text-onyx";

function openPdf(
  open: ReturnType<typeof useStandardPdfDrawer>["open"],
  entry: StandardCatalogEntry,
) {
  open({
    src: standardPdfApiPath(entry.slug),
    title: entry.code,
    description: entry.subtitle,
  });
}

function PdfActions({
  entry,
  onViewPdf,
}: {
  entry: StandardCatalogEntry;
  onViewPdf: (entry: StandardCatalogEntry) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onViewPdf(entry)}
        className={iconButtonClass}
        aria-label={`View ${entry.title} PDF`}
        title="View PDF"
      >
        <img
          src="/icons/pdf.svg"
          alt=""
          className="h-5 w-5"
          aria-hidden
        />
      </button>
      <a
        href={standardPdfApiPath(entry.slug)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${entry.title} PDF in new tab`}
        title="Open in new tab"
        className={iconButtonClass}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

function StandardCard({
  entry,
  onViewPdf,
}: {
  entry: StandardCatalogEntry;
  onViewPdf: (entry: StandardCatalogEntry) => void;
}) {
  const isLive = entry.status === "active";

  return (
    <article className="group flex h-full flex-col rounded-(--radius-card) border border-silver bg-panel p-6 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel">
        {entry.title}
      </p>

      <h2 className="mt-3 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-onyx sm:text-[30px]">
        {entry.code}
      </h2>
      <p className="mt-2 text-[15px] font-medium text-charcoal">
        {entry.subtitle}
      </p>

      <p className="mt-5 flex-1 text-[14px] leading-relaxed text-graphite">
        {entry.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-silver pt-5">
        <PdfActions entry={entry} onViewPdf={onViewPdf} />
        {isLive ? (
          <Badge tone="active">Available in WeldDoc</Badge>
        ) : (
          <Badge tone="expiring">Coming soon</Badge>
        )}
      </div>
    </article>
  );
}

export function StandardsHub({ userName }: { userName: string }) {
  const { open } = useStandardPdfDrawer();
  const firstName = userName.trim().split(/\s+/)[0] || "there";

  function viewPdf(entry: StandardCatalogEntry) {
    openPdf(open, entry);
  }

  return (
    <>
      <PageHeader
        title="Standards"
        description={`${greeting(firstName)} · reference library for qualification standards and PDFs`}
      />

      <div className="grid gap-5 px-8 py-8 sm:grid-cols-2">
        {WELDING_STANDARDS_CATALOG.map((entry) => (
          <StandardCard key={entry.slug} entry={entry} onViewPdf={viewPdf} />
        ))}
      </div>
    </>
  );
}
