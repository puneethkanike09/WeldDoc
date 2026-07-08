"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  FileSpreadsheet,
  ImageIcon,
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
  ready: { label: "Ready", tone: "active" },
  missing: { label: "Missing", tone: "expiring" },
  duplicate: { label: "Duplicate", tone: "ember" },
  invalid_type: { label: "Invalid", tone: "expired" },
};

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

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
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
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
        toast.error("Select a ZIP file first.");
        return null;
      }
      fd.append("zip", zipFile);
      return fd;
    }

    if (!excelFile) {
      toast.error("Select an Excel file first.");
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
              `Validation failed (${res.status}).`,
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
        if (result.fileError) {
          toast.error(result.fileError);
        } else if (!result.ok) {
          toast.error(`${result.summary.errorCount} validation error(s) found.`);
        } else {
          toast.success("File validated — review and confirm import.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Validation failed.");
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
          `Imported ${result.weldersCreated} welder(s) and ${result.qualificationsCreated} qualification(s).`,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Bulk import from Excel
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Download the single-sheet template and fill one row per
              qualification, repeating the welder name and W# No on each of that
              welder&apos;s rows. Only the welder name and W# No are required.
              If a W# already exists in WeldDoc, the qualification is attached
              to that welder; otherwise a new welder is created.
            </p>
            <p className="mt-2 text-sm text-graphite">
              For legacy certificates, enter{" "}
              <span className="font-medium text-charcoal">expiry_date</span> and{" "}
              <span className="font-medium text-charcoal">
                continuity_last_verified
              </span>{" "}
              from the current certificate — WeldDoc stores those dates as-is
              and does not recalculate them from the original test date.
            </p>
            <p className="mt-2 text-sm text-graphite">
              Optional welder photos: name each file{" "}
              <span className="font-mono text-xs text-charcoal">W#02.jpg</span>{" "}
              (matching the plant ID) or set the{" "}
              <span className="font-mono text-xs text-charcoal">
                photo_filename
              </span>{" "}
              column. Missing photos are warned but do not block import.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/welders/bulk-import/template"
              download="welddoc-welder-import-template.xlsx"
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-silver bg-panel px-3.5 font-display text-sm font-medium tracking-tight text-onyx transition-all duration-150 hover:bg-frost active:translate-y-px"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download template
            </a>
          </div>

          <form onSubmit={handleValidate} className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <ModeToggle
                active={uploadMode === "excel_photos"}
                onClick={() => {
                  setUploadMode("excel_photos");
                  resetPreview();
                }}
                icon={ImageIcon}
                label="Excel + photos"
              />
              <ModeToggle
                active={uploadMode === "zip"}
                onClick={() => {
                  setUploadMode("zip");
                  resetPreview();
                }}
                icon={Archive}
                label="ZIP package"
              />
            </div>

            {uploadMode === "excel_photos" ? (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel">
                    Step 1 — Excel file
                  </p>
                  <label className="block">
                    <span className="sr-only">Excel file (.xlsx)</span>
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
                  </label>
                  {excelFile && (
                    <p className="mt-1.5 text-xs text-charcoal">
                      Selected: {excelFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel">
                    Step 2 — Welder photos (optional)
                  </p>
                  <div
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border border-dashed bg-frost px-4 py-6 text-sm transition-colors",
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
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
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
                        document.getElementById("import-photo-input")?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <UploadCloud className="h-8 w-8 text-steel" />
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-charcoal">
                        {photoFiles.length} photo
                        {photoFiles.length === 1 ? "" : "s"} selected
                      </p>
                      <button
                        type="button"
                        className="text-xs text-ember hover:underline"
                        onClick={() => {
                          setPhotoFiles([]);
                          resetPreview();
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel">
                  ZIP with Excel + photos/ folder
                </p>
                <label className="block">
                  <span className="sr-only">ZIP file</span>
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
                </label>
                {zipFile && (
                  <p className="mt-1.5 text-xs text-charcoal">
                    Selected: {zipFile.name}
                  </p>
                )}
                <p className="mt-2 text-xs text-steel">
                  Include one .xlsx file and a{" "}
                  <span className="font-mono">photos/</span> folder with welder
                  images.
                </p>
              </div>
            )}

            <Button type="submit" variant="ghost" size="md" disabled={isValidating}>
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Validate file
            </Button>
          </form>
        </CardBody>
      </Card>

      {preview && (
        <Card>
          <CardBody className="space-y-5">
            {preview.fileError ? (
              <p className="rounded-[10px] bg-expired/10 px-4 py-3 text-sm text-expired-ink">
                {preview.fileError}
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-5">
                  <SummaryTile label="Rows" value={preview.summary.totalRows} />
                  <SummaryTile
                    label="New welders"
                    value={preview.summary.newWelderCount}
                  />
                  <SummaryTile
                    label="Existing (attach)"
                    value={preview.summary.existingWelderCount}
                  />
                  <SummaryTile
                    label="Qualifications"
                    value={preview.summary.qualificationCount}
                  />
                  <SummaryTile
                    label="Errors"
                    value={preview.summary.errorCount}
                    tone={preview.summary.errorCount > 0 ? "danger" : "ok"}
                  />
                </div>

                {preview.warnings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#8a6a00]">
                      Warnings ({preview.warnings.length})
                    </p>
                    <div className="sleek-scroll max-h-48 overflow-y-auto rounded-[10px] border border-expiring/40 bg-expiring/10">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-expiring/30 text-xs uppercase tracking-wide text-[#8a6a00]">
                            <th className="px-3 py-2 font-medium">Row</th>
                            <th className="px-3 py-2 font-medium">Column</th>
                            <th className="px-3 py-2 font-medium">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.warnings.map((warn, i) => (
                            <tr
                              key={`${warn.excelRow ?? "file"}-${warn.column ?? ""}-${i}`}
                              className="border-b border-expiring/20 last:border-0"
                            >
                              <td className="px-3 py-2 font-mono text-xs text-charcoal">
                                {warn.excelRow ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-steel">
                                {warn.column ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-graphite">
                                {warn.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {preview.rows.length > 0 && (
                  <ImportPreviewTable
                    rows={preview.rows}
                    errors={preview.errors}
                  />
                )}

                {preview.photoResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-charcoal">
                      Photo matching
                    </p>
                    <div className="sleek-scroll max-h-56 overflow-y-auto rounded-[10px] border border-silver">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-silver bg-frost text-xs uppercase tracking-wide text-steel">
                            <th className="px-3 py-2 font-medium">W# No</th>
                            <th className="px-3 py-2 font-medium">Filename</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.photoResults.map((row) => {
                            const meta = PHOTO_STATUS[row.status];
                            return (
                              <tr
                                key={row.plantWelderId}
                                className="border-b border-silver/60 last:border-0"
                              >
                                <td className="px-3 py-2 font-mono text-xs text-charcoal">
                                  {row.plantWelderId}
                                </td>
                                <td className="px-3 py-2 text-xs text-graphite">
                                  {row.filename ?? "—"}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge tone={meta.tone}>{meta.label}</Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {preview.errors.length > 0 && !preview.ok && (
                  <p className="text-sm text-graphite">
                    Fix the problems listed below in your Excel file, then upload
                    it again.
                  </p>
                )}

                {preview.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-expired-ink">
                      Errors ({preview.errors.length})
                    </p>
                    <div className="sleek-scroll max-h-72 overflow-y-auto rounded-[10px] border border-silver">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-silver bg-frost text-xs uppercase tracking-wide text-steel">
                            <th className="px-3 py-2 font-medium">Row</th>
                            <th className="px-3 py-2 font-medium">Column</th>
                            <th className="px-3 py-2 font-medium">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.errors.map((err, i) => (
                            <tr
                              key={`${err.excelRow}-${err.column}-${i}`}
                              className="border-b border-silver/60 last:border-0"
                            >
                              <td className="px-3 py-2 font-mono text-xs text-charcoal">
                                {err.excelRow}
                              </td>
                              <td className="px-3 py-2 text-xs text-steel">
                                {err.column ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-graphite">
                                {err.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {preview.ok && (
                  <div className="flex flex-wrap items-center justify-end gap-3">
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
                      Confirm import
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

function ModeToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-[10px] border px-3.5 font-display text-sm font-medium tracking-tight transition-all duration-150",
        active
          ? "border-ember bg-ember/10 text-ember"
          : "border-silver bg-panel text-onyx hover:bg-frost",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "ok";
}) {
  return (
    <div className="rounded-[10px] border border-silver bg-frost/40 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-steel">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-bold tabular-nums ${
          tone === "danger"
            ? "text-expired-ink"
            : tone === "ok"
              ? "text-active-ink"
              : "text-onyx"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
