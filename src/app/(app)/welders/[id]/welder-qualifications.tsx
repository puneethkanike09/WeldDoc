"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ButtonLink, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/app/confirm-delete-button";
import { ValidationForm } from "./validation-form";
import { SignedCertificateForm } from "./signed-certificate-form";
import {
  deleteWpq,
  deleteValidation,
  saveValidation,
  uploadSignedCertificate,
} from "./qualify/actions";
import { FileDown, FileText, FileCheck, Plus, Trash2, Workflow } from "lucide-react";

type BadgeTone = "active" | "expiring" | "expired" | "neutral" | "sapphire";

export interface ValidationView {
  id: string;
  kind: "continuity" | "revalidation";
  validatedOn: string;
  validatorName: string | null;
  note: string | null;
  newExpiry: string | null;
  docUrl: string | null;
}

export interface QualView {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusLabel: string;
  statusTone: BadgeTone;
  expiry: string;
  daysToExpiry: number | null;
  isLegacy: boolean;
  isApproved: boolean;
  hasSignedCertificate: boolean;
  canLogValidation: boolean;
  rangeSummary: string | null;
  validations: ValidationView[];
}

const DOT_COLOR: Record<BadgeTone, string> = {
  active: "bg-[#22a957]",
  expiring: "bg-[#e0a500]",
  expired: "bg-[#d4382c]",
  sapphire: "bg-sapphire",
  neutral: "bg-steel",
};

export function WelderQualifications({
  welderId,
  quals,
  defaultSelectedId,
}: {
  welderId: string;
  quals: QualView[];
  defaultSelectedId?: string;
}) {
  const initial =
    quals.find((q) => q.id === defaultSelectedId)?.id ?? quals[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initial);

  // Keep selection valid if the list changes (e.g. after a deletion).
  useEffect(() => {
    if (!quals.some((q) => q.id === selectedId)) {
      setSelectedId(quals[0]?.id ?? null);
    }
  }, [quals, selectedId]);

  const selected = useMemo(
    () => quals.find((q) => q.id === selectedId) ?? null,
    [quals, selectedId],
  );

  const select = (id: string) => {
    setSelectedId(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("wpq", id);
      window.history.replaceState(null, "", url);
    } catch {
      // best-effort deep-link sync; ignore if unavailable
    }
  };

  if (quals.length === 0) {
    return (
      <div className="rounded-(--radius-card) border border-dashed border-silver bg-panel px-6 py-16 text-center">
        <h3 className="font-display text-lg font-semibold text-onyx">
          No qualifications yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-graphite">
          Start the 4-step workflow to issue this welder&apos;s first
          certificate.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href={`/welders/${welderId}/qualify`} size="sm">
            <Plus className="h-4 w-4" /> New qualification
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Master list */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-onyx">
            Qualifications{" "}
            <span className="text-steel">({quals.length})</span>
          </h2>
          <ButtonLink href={`/welders/${welderId}/qualify`} size="sm">
            <Plus className="h-4 w-4" /> New
          </ButtonLink>
        </div>
        <ul className="sleek-scroll space-y-1.5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1.5">
          {quals.map((q) => {
            const active = q.id === selectedId;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => select(q.id)}
                  aria-current={active}
                  className={`w-full rounded-[10px] border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-ember/40 bg-ember/5"
                      : "border-silver bg-panel hover:bg-frost"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-display text-[13.5px] font-semibold text-onyx">
                      {q.title}
                    </span>
                    <span
                      title={q.statusLabel}
                      aria-label={`Status: ${q.statusLabel}`}
                      className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[q.statusTone]}`}
                    />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-steel">
                    {q.subtitle}
                  </p>
                  <p className="mt-1 text-xs text-graphite">
                    Expires {q.expiry}
                    {q.daysToExpiry !== null &&
                      q.daysToExpiry >= 0 &&
                      q.daysToExpiry <= 60 && (
                        <span className="ml-1 text-[#8a6a00]">
                          · {q.daysToExpiry}d
                        </span>
                      )}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Detail */}
      {selected && (
        <div className="min-w-0 rounded-(--radius-card) border border-silver bg-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-onyx">
                  {selected.title}
                </h3>
                <Badge tone={selected.statusTone}>{selected.statusLabel}</Badge>
                {selected.isLegacy && <Badge tone="outline">Legacy</Badge>}
              </div>
              <p className="mt-1 text-[13px] text-steel">{selected.subtitle}</p>
            </div>
            <div className="text-right text-[13px]">
              <p className="text-steel">Expires</p>
              <p className="font-medium text-onyx">{selected.expiry}</p>
              {selected.daysToExpiry !== null &&
                selected.daysToExpiry >= 0 &&
                selected.daysToExpiry <= 60 && (
                  <p className="text-xs text-[#8a6a00]">
                    in {selected.daysToExpiry} days
                  </p>
                )}
            </div>
          </div>

          {selected.rangeSummary && (
            <div className="mt-4 rounded-[10px] bg-frost p-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                Range of approval
              </p>
              <p className="mt-1 text-[13px] leading-snug text-charcoal">
                {selected.rangeSummary}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink
              href={`/welders/${welderId}/qualify?wpq=${selected.id}`}
              variant="ghost"
              size="sm"
            >
              <Workflow className="h-4 w-4" /> Open workflow
            </ButtonLink>
            {selected.isApproved && (
              <>
                <ButtonLink
                  href={`/welders/${welderId}/certificate?wpq=${selected.id}`}
                  variant="subtle"
                  size="sm"
                >
                  <FileDown className="h-4 w-4" /> Certificate
                </ButtonLink>
                {selected.hasSignedCertificate && (
                  <ButtonLink
                    href={`/welders/${welderId}/signed-certificate?wpq=${selected.id}`}
                    variant="subtle"
                    size="sm"
                  >
                    <FileCheck className="h-4 w-4" /> Signed copy
                  </ButtonLink>
                )}
              </>
            )}
            <ConfirmDeleteButton
              action={() => deleteWpq(welderId, selected.id)}
              title="Delete this qualification?"
              description="This permanently removes the qualification, its range of approval, NDT records, certificate, and every continuity/revalidation log and uploaded document. This cannot be undone."
              confirmLabel="Delete qualification"
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-ember"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              }
            />
          </div>

          {selected.isApproved && (
            <SignedCertificateForm
              hasSignedCertificate={selected.hasSignedCertificate}
              action={(fd) =>
                uploadSignedCertificate(welderId, selected.id, fd)
              }
            />
          )}

          {/* Continuity & revalidation log */}
          <div className="mt-6">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
              Continuity &amp; revalidation log ({selected.validations.length})
            </p>
            {selected.validations.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {selected.validations.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-start justify-between gap-3 rounded-[10px] border border-silver px-3 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            v.kind === "revalidation" ? "sapphire" : "active"
                          }
                        >
                          {v.kind === "revalidation"
                            ? "Revalidation"
                            : "Continuity"}
                        </Badge>
                        <span className="font-medium text-onyx">
                          {v.validatedOn}
                        </span>
                      </div>
                      {v.validatorName && (
                        <p className="mt-1 text-steel">By {v.validatorName}</p>
                      )}
                      {v.note && (
                        <p className="mt-0.5 text-graphite">{v.note}</p>
                      )}
                      {v.newExpiry && (
                        <p className="mt-0.5 text-steel">
                          New expiry: {v.newExpiry}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {v.docUrl ? (
                        <a
                          href={v.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-ember hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View doc
                        </a>
                      ) : (
                        <span className="text-xs text-steel">No doc</span>
                      )}
                      <ConfirmDeleteButton
                        action={() => deleteValidation(welderId, v.id)}
                        title="Delete this log entry?"
                        description="This removes the continuity/revalidation entry and its uploaded document. The qualification's current expiry date is not recalculated."
                        confirmLabel="Delete entry"
                        trigger={
                          <button
                            type="button"
                            aria-label="Delete log entry"
                            className="grid h-7 w-7 place-items-center rounded-sm text-steel hover:bg-ember/10 hover:text-ember"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-steel">
                No continuity or revalidation logged yet.
              </p>
            )}
          </div>

          {selected.canLogValidation && (
            <ValidationForm
              action={(fd) => saveValidation(welderId, selected.id, fd)}
            />
          )}
        </div>
      )}
    </div>
  );
}
