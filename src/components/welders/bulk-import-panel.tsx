"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ImportPreviewTable } from "@/components/welders/import-preview-table";
import type { CommitWelderImportResult } from "@/app/(app)/welders/import/actions";
import type {
  ImportValidationError,
  ImportValidationSummary,
  ImportWarning,
  ValidatedImportRow,
} from "@/lib/welders/bulk-import/types";
import type {
  CertificateMatchResult,
  CertificateMatchStatus,
} from "@/lib/welders/bulk-import/match-import-docs";
import type {
  PhotoMatchResult,
  PhotoMatchStatus,
} from "@/lib/welders/bulk-import/match-import-photos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PreviewState = {
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  warnings: ImportWarning[];
  summary: ImportValidationSummary;
  photoResults: PhotoMatchResult[];
  certificateResults: CertificateMatchResult[];
  continuityWarnings: string[];
  fileError: string | null;
  ok: boolean;
};

type ValidateResult = {
  ok: boolean;
  fileError: string | null;
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  warnings: ImportWarning[];
  summary: ImportValidationSummary;
  photoResults: PhotoMatchResult[];
  certificateResults?: CertificateMatchResult[];
  continuityWarnings?: string[];
};

const PHOTO_STATUS: Record<
  PhotoMatchStatus,
  { label: string; tone: "active" | "expiring" | "expired" | "ember" }
> = {
  ready: { label: "Photo found", tone: "active" },
  missing: { label: "No photo (OK — you can add later)", tone: "expiring" },
  duplicate: { label: "More than one photo matched", tone: "ember" },
  invalid_type: { label: "File type not supported", tone: "expired" },
};

const CERT_STATUS: Record<
  CertificateMatchStatus,
  { label: string; tone: "active" | "expiring" | "expired" | "ember" }
> = {
  ready: { label: "Certificate PDF found", tone: "active" },
  missing: { label: "No certificate PDF (OK)", tone: "expiring" },
  duplicate: { label: "More than one certificate PDF", tone: "ember" },
  invalid_type: { label: "Certificate file type not supported", tone: "expired" },
  too_large: { label: "Certificate PDF too large", tone: "expired" },
};

function buildSummarySentence(preview: PreviewState): string {
  const { summary, ok } = preview;
  if (!ok && summary.errorCount > 0) {
    return summary.errorCount === 1
      ? "1 problem to fix in the spreadsheet inside your ZIP."
      : `${summary.errorCount} problems to fix in the spreadsheet inside your ZIP.`;
  }

  const parts: string[] = [];
  if (summary.newWelderCount > 0) {
    parts.push(
      `${summary.newWelderCount} new welder${summary.newWelderCount === 1 ? "" : "s"}`,
    );
  }
  if (summary.existingWelderCount > 0) {
    parts.push(
      `${summary.existingWelderCount} existing welder${summary.existingWelderCount === 1 ? "" : "s"} (certificates will be added)`,
    );
  }
  if (summary.qualificationCount > 0) {
    parts.push(
      `${summary.qualificationCount} certificate${summary.qualificationCount === 1 ? "" : "s"}`,
    );
  }

  if (parts.length === 0) {
    return "Ready to import.";
  }
  return `Ready to import: ${parts.join(", ")}.`;
}

function photoSummaryLine(results: PhotoMatchResult[]): string {
  const ready = results.filter((r) => r.status === "ready").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const other = results.length - ready - missing;
  const bits: string[] = [];
  if (ready > 0) {
    bits.push(`${ready} photo${ready === 1 ? "" : "s"} found`);
  }
  if (missing > 0) {
    bits.push(`${missing} missing`);
  }
  if (other > 0) {
    bits.push(`${other} need attention`);
  }
  return bits.join(" · ") || "No photos matched";
}

function certSummaryLine(results: CertificateMatchResult[]): string {
  const ready = results.filter((r) => r.status === "ready").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const other = results.length - ready - missing;
  const bits: string[] = [];
  if (ready > 0) {
    bits.push(`${ready} certificate PDF${ready === 1 ? "" : "s"} found`);
  }
  if (missing > 0) {
    bits.push(`${missing} without certificate PDF`);
  }
  if (other > 0) {
    bits.push(`${other} need attention`);
  }
  return bits.join(" · ") || "No certificate PDFs matched";
}

export function BulkImportPanel({
  commitAction,
}: {
  commitAction: (formData: FormData) => Promise<CommitWelderImportResult>;
}) {
  const router = useRouter();
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [photoDetailsOpen, setPhotoDetailsOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [isValidating, startValidate] = useTransition();
  const [isCommitting, startCommit] = useTransition();
  const [jobStatus, setJobStatus] = useState<{
    id: string;
    status: string;
    progress: number;
    error?: string | null;
  } | null>(null);

  function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!zipFile) {
      toast.error("Choose your ZIP file first.");
      return;
    }

    const fd = new FormData();
    fd.append("zip", zipFile);

    startValidate(async () => {
      try {
        const res = await fetch("/api/welders/bulk-import/validate", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(
            (err as { error?: string } | null)?.error ??
              `Could not check the ZIP (${res.status}).`,
          );
        }
        const result = (await res.json()) as ValidateResult;
        setPreview({
          rows: result.rows,
          errors: result.errors,
          warnings: result.warnings ?? [],
          summary: result.summary,
          photoResults: result.photoResults ?? [],
          certificateResults: result.certificateResults ?? [],
          continuityWarnings: result.continuityWarnings ?? [],
          fileError: result.fileError,
          ok: result.ok && !result.fileError,
        });
        setNotesOpen(false);
        setPhotoDetailsOpen(false);
        setDataOpen(false);
        if (result.fileError) {
          toast.error(result.fileError);
        } else if (!result.ok) {
          toast.error(
            result.summary.errorCount === 1
              ? "1 problem to fix in the spreadsheet."
              : `${result.summary.errorCount} problems to fix in the spreadsheet.`,
          );
        } else {
          toast.success("Looks good — review below, then import.");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not check the ZIP.",
        );
      }
    });
  }

  function handleCommit() {
    if (!preview?.ok || !preview.rows.length || !zipFile) return;

    startCommit(async () => {
      try {
        const fd = new FormData();
        fd.append("rows", JSON.stringify(preview.rows));
        fd.append("zip", zipFile);

        const result = await commitAction(fd);

        if (result.queued && result.importJobId) {
          toast.success("Import started in the background.");
          setJobStatus({
            id: result.importJobId,
            status: "queued",
            progress: 0,
          });
          void pollImportJob(result.importJobId);
          return;
        }

        toast.success(
          `Imported ${result.weldersCreated} welder(s) and ${result.qualificationsCreated} certificate(s).`,
        );
        router.push("/welders");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  async function pollImportJob(jobId: string) {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/welders/bulk-import/jobs/${jobId}`);
        if (!res.ok) continue;
        const data = (await res.json()) as {
          status: string;
          progress: number;
          error_message?: string | null;
          summary?: {
            weldersCreated?: number;
            qualificationsCreated?: number;
          };
        };
        setJobStatus({
          id: jobId,
          status: data.status,
          progress: data.progress ?? 0,
          error: data.error_message,
        });
        if (data.status === "succeeded") {
          toast.success(
            `Imported ${data.summary?.weldersCreated ?? 0} welder(s) and ${data.summary?.qualificationsCreated ?? 0} certificate(s).`,
          );
          router.push("/welders");
          router.refresh();
          return;
        }
        if (data.status === "failed") {
          toast.error(data.error_message ?? "Import failed in the background.");
          return;
        }
      } catch {
        // keep polling
      }
    }
    toast.error("Import is still running — refresh welders later to check.");
  }

  function resetPreview() {
    setPreview(null);
    setJobStatus(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Import welders
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Add many welders at once by uploading one ZIP file. Follow the
              steps below — photos and PDFs are optional.
            </p>
          </div>

          <ol className="list-decimal space-y-3 pl-5 text-sm text-graphite">
            <li>
              <span className="font-medium text-charcoal">
                Download the blank spreadsheet
              </span>{" "}
              and fill one row per certificate. Repeat the welder name and W#
              on every row for that person.
            </li>
            <li>
              <span className="font-medium text-charcoal">
                Make a folder on your computer
              </span>{" "}
              and put the filled spreadsheet inside it as{" "}
              <span className="font-mono text-xs text-charcoal">Import.xlsx</span>
              .
            </li>
            <li>
              <span className="font-medium text-charcoal">
                Add optional folders
              </span>{" "}
              next to the spreadsheet (you can skip any of these):
              <ul className="mt-2 list-disc space-y-1 pl-5 text-graphite">
                <li>
                  <span className="font-mono text-xs text-charcoal">photos/</span>{" "}
                  — e.g. <span className="font-mono text-xs">W#14.jpg</span>
                </li>
                <li>
                  <span className="font-mono text-xs text-charcoal">
                    certificates/
                  </span>{" "}
                  — e.g. <span className="font-mono text-xs">W#14.pdf</span>
                </li>
                <li>
                  <span className="font-mono text-xs text-charcoal">
                    continuity/
                  </span>{" "}
                  — e.g.{" "}
                  <span className="font-mono text-xs">W#14_2025-08-02.pdf</span>{" "}
                  or{" "}
                  <span className="font-mono text-xs">W#14_cont_1.pdf</span>{" "}
                  (max 10 per W#)
                </li>
              </ul>
            </li>
            <li>
              <span className="font-medium text-charcoal">
                Zip that folder
              </span>{" "}
              (right‑click → Compress / Send to compressed folder), then choose
              the ZIP below.
            </li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/welders/bulk-import/template"
              download="welddoc-welder-import-template.xlsx"
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-silver bg-panel px-3.5 font-display text-sm font-medium tracking-tight text-onyx transition-all duration-150 hover:bg-frost active:translate-y-px"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download blank spreadsheet
            </a>
            <a
              href="/api/welders/bulk-import/client-guide"
              download="welddoc-client-import-date-guide.xlsx"
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-silver bg-panel px-3.5 font-display text-sm font-medium tracking-tight text-onyx transition-all duration-150 hover:bg-frost active:translate-y-px"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download date guide (for existing data)
            </a>
          </div>

          <div className="rounded-[10px] border border-silver bg-frost px-3 py-2.5">
            <p className="mb-1.5 text-xs font-medium text-charcoal">
              Your ZIP should look like this
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-charcoal">
{`Import.xlsx
photos/          W#14.jpg
certificates/    W#14.pdf
continuity/      W#14_2025-08-02.pdf
                 W#14_cont_1.pdf  (max 10 per W#)`}
            </pre>
            <p className="mt-2 text-xs text-steel">
              Folders may be empty or missing. Only the spreadsheet is required.
            </p>
          </div>

          <form onSubmit={handleValidate} className="space-y-4">
            <div>
              <label
                htmlFor="import-zip-input"
                className="mb-1.5 block text-sm font-medium text-charcoal"
              >
                ZIP package
              </label>
              <input
                id="import-zip-input"
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                className="block w-full text-sm text-graphite file:mr-4 file:rounded-[10px] file:border file:border-silver file:bg-panel file:px-4 file:py-2 file:text-sm file:font-medium file:text-onyx hover:file:bg-frost"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setZipFile(file);
                  resetPreview();
                }}
              />
              {zipFile && (
                <p className="mt-1.5 text-xs text-charcoal">
                  Selected: {zipFile.name}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="md"
              disabled={isValidating || !zipFile}
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Check my ZIP
            </Button>
          </form>
        </CardBody>
      </Card>

      {preview && (
        <Card>
          <CardBody className="space-y-4">
            {preview.fileError ? (
              <p className="rounded-[10px] bg-expired/10 px-4 py-3 text-sm text-expired-ink">
                {preview.fileError}
              </p>
            ) : (
              <>
                <p
                  className={cn(
                    "text-base font-medium",
                    preview.ok ? "text-onyx" : "text-expired-ink",
                  )}
                >
                  {buildSummarySentence(preview)}
                </p>

                {preview.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-expired-ink">
                      Problems to fix in the spreadsheet
                    </p>
                    <ul className="sleek-scroll max-h-56 space-y-1.5 overflow-y-auto rounded-[10px] border border-silver bg-expired/5 px-3 py-2 text-sm">
                      {preview.errors.map((err, i) => (
                        <li
                          key={`${err.excelRow}-${err.column}-${i}`}
                          className="text-graphite"
                        >
                          <span className="font-medium text-charcoal">
                            Row {err.excelRow}
                            {err.column ? ` (${err.column})` : ""}:
                          </span>{" "}
                          {err.message}
                        </li>
                      ))}
                    </ul>
                    {!preview.ok && (
                      <p className="text-sm text-graphite">
                        Fix these in Import.xlsx, zip the folder again, then
                        upload the new ZIP.
                      </p>
                    )}
                  </div>
                )}

                {preview.warnings.length > 0 && (
                  <Disclosure
                    open={notesOpen}
                    onToggle={() => setNotesOpen((o) => !o)}
                    label={`Notes (import still works) — ${preview.warnings.length}`}
                  >
                    <ul className="sleek-scroll max-h-40 space-y-1.5 overflow-y-auto rounded-[10px] border border-expiring/40 bg-expiring/10 px-3 py-2 text-sm">
                      {preview.warnings.map((warn, i) => (
                        <li
                          key={`${warn.excelRow ?? "file"}-${warn.column ?? ""}-${i}`}
                          className="text-graphite"
                        >
                          {warn.excelRow != null && (
                            <span className="font-medium text-charcoal">
                              Row {warn.excelRow}:{" "}
                            </span>
                          )}
                          {warn.message}
                        </li>
                      ))}
                    </ul>
                  </Disclosure>
                )}

                {preview.photoResults.length > 0 && (
                  <div className="space-y-2">
                    <Disclosure
                      open={photoDetailsOpen}
                      onToggle={() => setPhotoDetailsOpen((o) => !o)}
                      label={photoSummaryLine(preview.photoResults)}
                    >
                      <ul className="sleek-scroll max-h-48 space-y-2 overflow-y-auto rounded-[10px] border border-silver px-3 py-2 text-sm">
                        {preview.photoResults.map((row) => {
                          const meta = PHOTO_STATUS[row.status];
                          return (
                            <li
                              key={row.plantWelderId}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <span className="font-mono text-xs text-charcoal">
                                {row.plantWelderId}
                              </span>
                              <span className="text-xs text-graphite">
                                {row.filename ?? "—"}
                              </span>
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                            </li>
                          );
                        })}
                      </ul>
                    </Disclosure>
                  </div>
                )}

                {preview.certificateResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-charcoal">
                      {certSummaryLine(preview.certificateResults)}
                    </p>
                    <ul className="sleek-scroll max-h-40 space-y-2 overflow-y-auto rounded-[10px] border border-silver px-3 py-2 text-sm">
                      {preview.certificateResults.map((row) => {
                        const meta = CERT_STATUS[row.status];
                        return (
                          <li
                            key={`cert-${row.plantWelderId}`}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span className="font-mono text-xs text-charcoal">
                              {row.plantWelderId}
                            </span>
                            <span className="text-xs text-graphite">
                              {row.filename ?? "—"}
                            </span>
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                    {preview.continuityWarnings.length > 0 && (
                      <p className="text-xs text-steel">
                        Continuity notes: {preview.continuityWarnings.length}{" "}
                        (see Notes above if listed)
                      </p>
                    )}
                  </div>
                )}

                {preview.rows.length > 0 && (
                  <Disclosure
                    open={dataOpen}
                    onToggle={() => setDataOpen((o) => !o)}
                    label="See what will be imported"
                  >
                    <ImportPreviewTable
                      rows={preview.rows}
                      errors={preview.errors}
                      compact
                    />
                  </Disclosure>
                )}

                {preview.ok && (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={resetPreview}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="md"
                      onClick={handleCommit}
                      disabled={
                        isCommitting ||
                        Boolean(jobStatus && jobStatus.status !== "failed")
                      }
                    >
                      {isCommitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Import these welders
                    </Button>
                  </div>
                )}

                {jobStatus && (
                  <p className="text-sm text-graphite">
                    {jobStatus.status === "queued" && "Import queued…"}
                    {jobStatus.status === "running" &&
                      `Import running… ${jobStatus.progress}%`}
                    {jobStatus.status === "failed" && (
                      <span className="text-expired-ink">
                        Import failed: {jobStatus.error ?? "Unknown error"}
                      </span>
                    )}
                    {jobStatus.status === "succeeded" && "Import complete."}
                  </p>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      <p className="text-sm text-steel">
        <Link href="/welders" className="text-ember hover:underline">
          Back to welders
        </Link>
      </p>
    </div>
  );
}

function Disclosure({
  open,
  onToggle,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal hover:text-onyx"
        onClick={onToggle}
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
        {label}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
