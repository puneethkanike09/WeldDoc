"use client";

import Link from "next/link";
import { QualListItemSkeleton } from "@/components/app/skeletons";
import { cn } from "@/lib/utils";
import {
  certificateExpiryHeading,
  continuityExpiryHeading,
  continuityExpiryTone,
} from "@/lib/qualify/expiry-display";
import { ButtonLink } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { QualProfileDetail } from "@/components/qualify/qualification-profile-detail";

export type QualListItem = Pick<
  QualProfileDetail,
  | "id"
  | "title"
  | "subtitle"
  | "statusLabel"
  | "statusTone"
  | "expiry"
  | "daysToExpiry"
  | "continuityDue"
  | "daysToContinuityDue"
  | "isMultiProcess"
>;

const DOT_COLOR: Record<QualListItem["statusTone"], string> = {
  active: "bg-[#22a957]",
  expiring: "bg-[#e0a500]",
  expired: "bg-[#d4382c]",
  sapphire: "bg-sapphire",
  neutral: "bg-steel",
};

export function QualificationSidebar({
  profilePath,
  qualParam,
  newQualHref,
  listItems,
  activeQualId,
  totalCount,
  page,
  pageSize,
  entityLabel,
  listLoading = false,
  onNavigate,
}: {
  profilePath: string;
  qualParam: "oq" | "wpq";
  newQualHref: string;
  listItems: QualListItem[];
  activeQualId: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  entityLabel: string;
  listLoading?: boolean;
  onNavigate: (href: string, next?: { qualId?: string; page?: number }) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function hrefFor(targetPage: number, qualId?: string | null) {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (qualId) params.set(qualParam, qualId);
    return `${profilePath}?${params.toString()}`;
  }

  function handleNavigate(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    next?: { qualId?: string; page?: number },
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(href, next);
  }

  return (
    <div className="lg:sticky lg:top-8 lg:self-start">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-onyx">
          Qualifications{" "}
          <span className="text-steel">({totalCount})</span>
        </h2>
        <ButtonLink href={newQualHref} size="sm">
          <Plus className="h-4 w-4" /> New
        </ButtonLink>
      </div>

      {listLoading ? (
        <div
          className="space-y-1.5"
          role="status"
          aria-label="Loading qualifications list"
        >
          {Array.from({ length: pageSize }, (_, i) => (
            <QualListItemSkeleton key={i} active={i === 0} />
          ))}
          <span className="sr-only">Loading qualifications list…</span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {listItems.map((q) => {
            const active = q.id === activeQualId;
            return (
              <li key={q.id}>
                <Link
                  href={hrefFor(page, q.id)}
                  onClick={(event) =>
                    handleNavigate(event, hrefFor(page, q.id), { qualId: q.id })
                  }
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block w-full rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-inverse-bg bg-panel"
                      : "border-silver bg-panel hover:bg-frost",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-display text-[13.5px] font-semibold text-onyx">
                      {q.title}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {q.isMultiProcess ? (
                        <span className="rounded-md bg-sapphire/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sapphire">
                          Multi
                        </span>
                      ) : null}
                      <span
                        title={q.statusLabel}
                        aria-label={`Status: ${q.statusLabel}`}
                        className={`h-2 w-2 rounded-full ${DOT_COLOR[q.statusTone]}`}
                      />
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-steel">{q.subtitle}</p>
                  <p className="mt-1 text-xs text-graphite">
                    {certificateExpiryHeading(q.statusTone, q.daysToExpiry)}{" "}
                    {q.expiry}
                    {q.daysToExpiry !== null &&
                      q.daysToExpiry >= 0 &&
                      q.daysToExpiry <= 60 && (
                        <span className="ml-1 text-[#8a6a00]">
                          · {q.daysToExpiry}d
                        </span>
                      )}
                  </p>
                  {q.continuityDue ? (
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        continuityExpiryTone(q.daysToContinuityDue) === "danger"
                          ? "text-ember"
                          : continuityExpiryTone(q.daysToContinuityDue) ===
                              "warning"
                            ? "text-[#8a6a00]"
                            : "text-graphite",
                      )}
                    >
                      {continuityExpiryHeading(q.daysToContinuityDue)}{" "}
                      {q.continuityDue}
                      {q.daysToContinuityDue !== null &&
                        q.daysToContinuityDue >= 0 &&
                        q.daysToContinuityDue <= 60 && (
                          <span className="ml-1">· {q.daysToContinuityDue}d</span>
                        )}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-3 flex items-center justify-between gap-2 border-t border-silver pt-3"
          aria-label={`${entityLabel} qualifications pages`}
        >
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1, activeQualId)}
              onClick={(event) =>
                handleNavigate(event, hrefFor(page - 1, activeQualId), {
                  page: page - 1,
                })
              }
              className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2 text-xs font-medium text-charcoal hover:bg-frost"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Link>
          ) : (
            <span className="inline-flex h-8 items-center gap-1 px-2 text-xs text-steel">
              <ChevronLeft className="h-4 w-4" />
              Prev
            </span>
          )}
          <span className="text-xs text-steel">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1, activeQualId)}
              onClick={(event) =>
                handleNavigate(event, hrefFor(page + 1, activeQualId), {
                  page: page + 1,
                })
              }
              className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2 text-xs font-medium text-charcoal hover:bg-frost"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex h-8 items-center gap-1 px-2 text-xs text-steel">
              Next
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
