"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";
import { cn } from "@/lib/utils";
import {
  WELDING_STANDARDS_CATALOG,
  standardPdfApiPath,
  type StandardCatalogEntry,
} from "@/lib/standards/catalog";
import { navigateToStandardWorkspace } from "@/lib/standards/active-standard";

function greeting(firstName: string): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${part}, ${firstName}`;
}

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-silver bg-panel text-graphite transition-colors hover:bg-frost hover:text-onyx";

const cardHeader = {
  header: "bg-inverse-bg",
  eyebrow: "text-inverse-fg/55",
  title: "text-inverse-fg",
  subtitle: "text-inverse-fg/75",
};

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
  onEnter,
  onViewPdf,
}: {
  entry: StandardCatalogEntry;
  onEnter: (entry: StandardCatalogEntry) => void;
  onViewPdf: (entry: StandardCatalogEntry) => void;
}) {
  const isLive = entry.status === "active";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-(--radius-card) border border-silver bg-panel">
      <div className={cn("px-6 py-5 sm:px-7 sm:py-6", cardHeader.header)}>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            cardHeader.eyebrow,
          )}
        >
          {entry.title}
        </p>

        <h2
          className={cn(
            "mt-3 font-display text-[26px] font-bold leading-[1.1] tracking-tight sm:text-[30px]",
            cardHeader.title,
          )}
        >
          {entry.code}
        </h2>
        <p className={cn("mt-2 text-[15px] font-medium", cardHeader.subtitle)}>
          {entry.subtitle}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-6 py-5 sm:px-7 sm:pb-6">
        <p className="flex-1 text-[14px] leading-relaxed text-graphite">
          {entry.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-silver pt-5">
          <PdfActions entry={entry} onViewPdf={onViewPdf} />

          {isLive ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => onEnter(entry)}
            >
              Open workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="md" disabled>
              Coming soon
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function StandardsHub({ userName }: { userName: string }) {
  const { open } = useStandardPdfDrawer();
  const firstName = userName.trim().split(/\s+/)[0] || "there";

  function enterWorkspace(entry: StandardCatalogEntry) {
    if (entry.status !== "active") return;
    navigateToStandardWorkspace(entry.slug);
  }

  function viewPdf(entry: StandardCatalogEntry) {
    openPdf(open, entry);
  }

  return (
    <>
      <PageHeader
        title="Standards"
        description={`${greeting(firstName)} · pick a qualification standard`}
      />

      <div className="grid gap-5 px-8 py-8 sm:grid-cols-2">
        {WELDING_STANDARDS_CATALOG.map((entry) => (
          <StandardCard
            key={entry.slug}
            entry={entry}
            onEnter={enterWorkspace}
            onViewPdf={viewPdf}
          />
        ))}
      </div>
    </>
  );
}
