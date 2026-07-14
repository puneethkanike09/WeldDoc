"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  Upload,
  UploadCloud,
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
  PhotoMatchResult,
  PhotoMatchStatus,
} from "@/lib/welders/bulk-import/match-import-photos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type UploadMode = "excel_photos" | "zip";

type PreviewState = {
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  warnings: ImportWarning[];
  summary: ImportValidationSummary;
  photoResults: PhotoMatchResult[];
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

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

function buildSummarySentence(preview: PreviewState): string {
  const { summary, ok } = preview;
  if (!ok && summary.errorCount > 0) {
    return summary.errorCount === 1
      ? "1 problem to fix in the spreadsheet."
      : `${summary.errorCount} problems to fix in the spreadsheet.`;
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

export function BulkImportPanel({
  commitAction,
}: {
  commitAction: (formData: FormData) => Promise<CommitWelderImportResult>;
}) {
  const router = useRouter();
  const [uploadMode, setUploadMode] = useState<UploadMode>("excel_photos");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [photoDetailsOpen, setPhotoDetailsOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [isValidating, startValidate] = useTransition();
  const [isCommitting, startCommit] = useTransition();

  const addPhotoFiles = useCallback((incoming: File[]) => {
    const images = incoming.filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f.name),
    );
    if (images.length === 0 && incoming.length > 0) {
      toast.error("Only JPG, PNG, and WebP images are accepted.");
      return;
    }
    setPhotoFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const next = [...prev];
      for (const file of images) {
        const key = `${file.name}:${file.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(file);
        }
      }
      return next;
    });
  }, []);

  function buildValidateFormData(): FormData | null {
    const fd = new FormData();

    if (uploadMode === "zip") {
      if (!zipFile) {
        toast.error("Choose a ZIP file first.");
        return null;
      }
      fd.append("zip", zipFile);
      return fd;
    }

    if (!excelFile) {
      toast.error("Choose a spreadsheet first.");
      return null;
    }

    fd.append("excel", excelFile);
    for (const photo of photoFiles) {
      fd.append("photos", photo);
    }
    return fd;
  }

  function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    const fd = buildValidateFormData();
    if (!fd) return;

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
              `Could not check the spreadsheet (${res.status}).`,
          );
        }
        const result = (await res.json()) as ValidateResult;
        setPreview({
          rows: result.rows,
          errors: result.errors,
          warnings: result.warnings ?? [],
          summary: result.summary,
          photoResults: result.photoResults ?? [],
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
          err instanceof Error ? err.message : "Could not check the spreadsheet.",
        );
      }
    });
  }

  function handleCommit() {
    if (!preview?.ok || !preview.rows.length) return;

    startCommit(async () => {
      try {
        const fd = new FormData();
        fd.append("rows", JSON.stringify(preview.rows));

        if (uploadMode === "zip" && zipFile) {
          fd.append("zip", zipFile);
        } else {
          for (const photo of photoFiles) {
            fd.append("photos", photo);
          }
        }

        const result = await commitAction(fd);
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

  function resetPreview() {
    setPreview(null);
  }

  function switchToZip() {
    setUploadMode("zip");
    setExcelFile(null);
    setPhotoFiles([]);
    setPhotosOpen(false);
    resetPreview();
  }

  function switchToExcel() {
    setUploadMode("excel_photos");
    setZipFile(null);
    resetPreview();
  }

  const photosWereProvided =
    uploadMode === "zip" || photoFiles.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Import welders
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Fill the blank spreadsheet (one row per certificate). Repeat the
              welder name and W# on every row for that person — blank cells stay
              blank and are not copied from the row above. Photos are optional
              (e.g. W#02.jpg). For existing certificates, use the date guide.
            </p>
          </div>

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

          <form onSubmit={handleValidate} className="space-y-4">
            {uploadMode === "excel_photos" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal">
                    Spreadsheet
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="block w-full text-sm text-graphite file:mr-4 file:rounded-[10px] file:border file:border-silver file:bg-panel file:px-4 file:py-2 file:text-sm file:font-medium file:text-onyx hover:file:bg-frost"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setExcelFile(file);
                      resetPreview();
                    }}
                  />
                  {excelFile && (
                    <p className="mt-1.5 text-xs text-charcoal">
                      Selected: {excelFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal hover:text-onyx"
                    onClick={() => setPhotosOpen((o) => !o)}
                    aria-expanded={photosOpen}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        photosOpen && "rotate-180",
                      )}
                    />
                    Add welder photos (optional)
                    {photoFiles.length > 0 && (
                      <span className="font-normal text-steel">
                        — {photoFiles.length} selected
                      </span>
                    )}
                  </button>

                  {photosOpen && (
                    <div className="mt-2 space-y-2">
                      <div
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border border-dashed bg-frost px-4 py-5 text-sm transition-colors",
                          photoDragOver
                            ? "border-ember bg-ember/5"
                            : "border-silver hover:border-onyx/40",
                        )}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setPhotoDragOver(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setPhotoDragOver(true);
                        }}
                        onDragLeave={(e) => {
                          if (
                            !e.currentTarget.contains(e.relatedTarget as Node)
                          ) {
                            setPhotoDragOver(false);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setPhotoDragOver(false);
                          addPhotoFiles(Array.from(e.dataTransfer.files));
                          resetPreview();
                        }}
                        onClick={() =>
                          document.getElementById("import-photo-input")?.click()
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            document
                              .getElementById("import-photo-input")
                              ?.click();
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <UploadCloud className="h-7 w-7 text-steel" />
                        <p className="font-medium text-charcoal">
                          Drop photos here or click to browse
                        </p>
                        <p className="text-xs text-steel">
                          JPG, PNG, or WebP — e.g. W#02.jpg
                        </p>
                        <input
                          id="import-photo-input"
                          type="file"
                          accept={IMAGE_ACCEPT}
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            addPhotoFiles(Array.from(e.target.files ?? []));
                            e.target.value = "";
                            resetPreview();
                          }}
                        />
                      </div>
                      {photoFiles.length > 0 && (
                        <button
                          type="button"
                          className="text-xs text-ember hover:underline"
                          onClick={() => {
                            setPhotoFiles([]);
                            resetPreview();
                          }}
                        >
                          Clear photos
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm text-steel">
                  <button
                    type="button"
                    className="text-ember hover:underline"
                    onClick={switchToZip}
                  >
                    Have photos in a ZIP folder?
                  </button>
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal">
                    ZIP file
                  </label>
                  <p className="mb-2 text-xs text-steel">
                    One spreadsheet plus a photos folder inside the ZIP.
                  </p>
                  <input
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
                <p className="text-sm text-steel">
                  <button
                    type="button"
                    className="text-ember hover:underline"
                    onClick={switchToExcel}
                  >
                    Back to spreadsheet upload
                  </button>
                </p>
              </div>
            )}

            <Button type="submit" size="md" disabled={isValidating}>
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Check my spreadsheet
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
                        Fix these in your spreadsheet, then upload it again.
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

                {photosWereProvided && preview.photoResults.length > 0 && (
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
                      disabled={isCommitting}
                    >
                      {isCommitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Import these welders
                    </Button>
                  </div>
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
