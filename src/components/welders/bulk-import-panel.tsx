"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ImportPreviewTable } from "@/components/welders/import-preview-table";
import { validatedRowToColumns } from "@/lib/welders/bulk-import/display";
import { validateParsedImport } from "@/lib/welders/bulk-import/validate";
import type { ImportColumnKey } from "@/lib/welders/bulk-import/columns";
import type {
  ImportValidationError,
  ImportValidationSummary,
  ValidatedImportRow,
} from "@/lib/welders/bulk-import/types";
import { toast } from "sonner";

type PreviewState = {
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  summary: ImportValidationSummary;
  fileError: string | null;
  ok: boolean;
};

type ValidateResult = {
  ok: boolean;
  fileError: string | null;
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  summary: ImportValidationSummary;
};

type CommitResult = {
  weldersCreated: number;
  qualificationsCreated: number;
};

export function BulkImportPanel({
  commitAction,
  existingPlantIds,
}: {
  commitAction: (rows: ValidatedImportRow[]) => Promise<CommitResult>;
  existingPlantIds: string[];
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isValidating, startValidate] = useTransition();
  const [isCommitting, startCommit] = useTransition();

  function handleValidate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Select an Excel file first.");
      return;
    }

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
          summary: result.summary,
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

  function handleCellChange(
    excelRow: number,
    column: ImportColumnKey,
    value: string,
  ) {
    setPreview((prev) => {
      if (!prev || prev.fileError) return prev;

      const draft = prev.rows.map((row) => ({
        excelRow: row.excelRow,
        raw: validatedRowToColumns(row),
      }));

      const target = draft.find((r) => r.excelRow === excelRow);
      if (!target) return prev;
      target.raw[column] = value;

      const result = validateParsedImport(draft, existingPlantIds);

      return {
        ...prev,
        rows: result.rows,
        errors: result.errors,
        summary: result.summary,
        ok: result.ok,
      };
    });
  }

  function handleCommit() {
    if (!preview?.ok || !preview.rows.length) return;

    startCommit(async () => {
      try {
        const result = await commitAction(preview.rows);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Bulk import from Excel
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Download the template, fill welder rows (with or without
              qualifications), then upload for validation before importing.
              Plant IDs use the same W#01 format as Add welder; employer and
              branch are filled from your organisation settings. Photos and PDFs
              can be added on each welder profile afterwards.
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

          <form onSubmit={handleValidate} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-charcoal">
                Excel file (.xlsx)
              </span>
              <input
                type="file"
                name="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="block w-full text-sm text-graphite file:mr-4 file:rounded-[10px] file:border file:border-silver file:bg-panel file:px-4 file:py-2 file:text-sm file:font-medium file:text-onyx hover:file:bg-frost"
              />
            </label>
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
                <div className="grid gap-3 sm:grid-cols-4">
                  <SummaryTile
                    label="Rows"
                    value={preview.summary.totalRows}
                  />
                  <SummaryTile
                    label="Welders"
                    value={preview.summary.welderCount}
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

                {preview.rows.length > 0 && (
                  <ImportPreviewTable
                    rows={preview.rows}
                    errors={preview.errors}
                    onCellChange={handleCellChange}
                  />
                )}

                {preview.errors.length > 0 && !preview.ok && (
                  <p className="text-sm text-graphite">
                    Fix the highlighted cells or review the errors below, then
                    confirm import when all errors are resolved.
                  </p>
                )}

                {preview.errors.length > 0 && (
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
                )}

                {preview.ok && (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setPreview(null)}
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
