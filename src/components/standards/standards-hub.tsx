"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { statTones, type StatTone } from "@/components/app/dashboard-stat";
import { Button } from "@/components/ui/button";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";
import {
  WELDING_STANDARDS_CATALOG,
  standardPdfApiPath,
  type StandardCatalogEntry,
} from "@/lib/standards/catalog";
import { setActiveStandardCookie } from "@/lib/standards/active-standard";
import { cn } from "@/lib/utils";

function greeting(firstName: string): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${part}, ${firstName}`;
}

function footerBorder(tone: StatTone): string {
  if (tone === "brand") return "border-inverse-fg/10";
  if (tone === "warning") return "border-warning-ink/15";
  return "border-white/15";
}

function iconHover(tone: StatTone): string {
  if (tone === "brand") return "hover:bg-inverse-fg/10";
  if (tone === "warning") return "hover:bg-warning-ink/10";
  return "hover:bg-white/10";
}

function pdfIconShell(tone: StatTone): string {
  if (tone === "brand") return "border-inverse-fg/15 bg-inverse-fg/10";
  if (tone === "warning") return "border-warning-ink/20 bg-warning-ink/10";
  return "border-white/15 bg-white/10";
}

function workspaceButtonClass(tone: StatTone): string {
  if (tone === "brand") {
    return "border-0 bg-inverse-fg text-inverse-bg shadow-none hover:bg-inverse-fg/90 hover:opacity-100";
  }
  return "border-0 bg-panel text-onyx shadow-[var(--shadow-subtle)] hover:bg-panel/90";
}

function comingSoonButtonClass(tone: StatTone): string {
  if (tone === "warning") {
    return "cursor-default border-warning-ink/20 bg-transparent text-warning-ink/60 opacity-70";
  }
  return "cursor-default border-white/20 bg-transparent text-white/60 opacity-70";
}

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
  tone,
  onViewPdf,
}: {
  entry: StandardCatalogEntry;
  tone: StatTone;
  onViewPdf: (entry: StandardCatalogEntry) => void;
}) {
  const t = statTones[tone];
  const iconClass = cn(
    "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors",
    pdfIconShell(tone),
    iconHover(tone),
    t.action,
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onViewPdf(entry)}
        className={iconClass}
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
        className={iconClass}
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
  const t = statTones[entry.cardTone];
  const isLive = entry.status === "active";

  return (
    <article
      className={cn(
        "flex flex-col rounded-[var(--radius-card)] border p-6 sm:p-8",
        t.shell,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-widest",
          t.label,
        )}
      >
        {entry.title}
      </p>

      <h2
        className={cn(
          "mt-3 font-display text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]",
          t.value,
        )}
      >
        {entry.code}
      </h2>
      <p className={cn("mt-2 text-[15px] font-medium", t.value, "opacity-85")}>
        {entry.subtitle}
      </p>
      <p className={cn("mt-4 text-[14px] leading-relaxed", t.hint)}>
        {entry.description}
      </p>

      <div
        className={cn(
          "mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6",
          footerBorder(entry.cardTone),
        )}
      >
        <PdfActions
          entry={entry}
          tone={entry.cardTone}
          onViewPdf={onViewPdf}
        />

        {isLive ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onEnter(entry)}
            className={workspaceButtonClass(entry.cardTone)}
          >
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled
            className={comingSoonButtonClass(entry.cardTone)}
          >
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

      <div className="flex flex-col gap-8 px-8 py-8">
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
