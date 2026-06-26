"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";
import {
  WELDING_STANDARDS_CATALOG,
  standardPdfApiPath,
  type StandardCatalogEntry,
} from "@/lib/standards/catalog";
import { setActiveStandardCookie } from "@/lib/standards/active-standard";

function greeting(firstName: string): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${part}, ${firstName}`;
}

const iconButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-silver bg-panel text-graphite transition-colors hover:bg-frost hover:text-onyx";

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
          className="h-6 w-6"
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
        <ExternalLink className="h-5 w-5" />
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
    <article
      className="flex h-full flex-col rounded-[var(--radius-card)] border border-silver bg-panel p-6 sm:p-8"
    >
      <p className="text-[11px] font-medium uppercase tracking-widest text-steel">
        {entry.title}
      </p>

      <h2 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-tight text-onyx sm:text-[34px]">
        {entry.code}
      </h2>
      <p className="mt-2 text-[15px] font-medium text-charcoal">
        {entry.subtitle}
      </p>
      <p className="mt-4 flex-1 text-[14px] leading-relaxed text-graphite">
        {entry.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-silver pt-6">
        <PdfActions entry={entry} onViewPdf={onViewPdf} />

        {isLive ? (
          <Button type="button" variant="primary" size="md" onClick={() => onEnter(entry)}>
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="md" disabled>
            Coming soon
          </Button>
        )}
      </div>
    </article>
  );
}

export function StandardsHub({ userName }: { userName: string }) {
  const router = useRouter();
  const { open } = useStandardPdfDrawer();
  const firstName = userName.trim().split(/\s+/)[0] || "there";

  function enterWorkspace(entry: StandardCatalogEntry) {
    if (entry.status !== "active") return;
    setActiveStandardCookie();
    router.push("/dashboard");
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

      <div className="grid gap-4 px-8 py-8 sm:grid-cols-2">
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
