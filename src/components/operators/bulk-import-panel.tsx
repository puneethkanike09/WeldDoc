"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { OperatorImportPreviewTable } from "@/components/operators/import-preview-table";
import {
  validateOperatorImport,
  commitOperatorImportAction,
} from "@/app/(app)/operators/import/actions";
import type {
  OperatorImportValidationError,
  OperatorImportValidationSummary,
  ValidatedOperatorImportRow,
} from "@/lib/operators/bulk-import/types";
import { toast } from "sonner";

type PreviewState = {
  rows: ValidatedOperatorImportRow[];
  errors: OperatorImportValidationError[];
  summary: OperatorImportValidationSummary;
  fileError: string | null;
  ok: boolean;
};

export function OperatorBulkImportPanel() {
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
        const result = await validateOperatorImport(fd);
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

  function handleCommit() {
    if (!preview?.ok || !preview.rows.length) return;

    startCommit(async () => {
      try {
        const result = await commitOperatorImportAction(preview.rows);
        toast.success(
          `Imported ${result.operatorsCreated} operator(s) and ${result.qualificationsCreated} qualification(s).`,
        );
        router.push("/operators");
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
              Download the template and fill one row per qualification, repeating
              the operator name and O# No on each of that operator&apos;s rows.
              Only the operator name and O# No are required. If an O# already
              exists in Weld.Doc, the qualification is attached to that operator;
              otherwise a new operator is created. Upload to validate — if any
              rows have problems, fix them in Excel and upload again.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/operators/import/template"
              download="welddoc-operator-import-template.xlsx"
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
                <div className="grid gap-3 sm:grid-cols-5">
                  <SummaryTile label="Rows" value={preview.summary.totalRows} />
                  <SummaryTile
                    label="New operators"
                    value={preview.summary.newOperatorCount}
                  />
                  <SummaryTile
                    label="Existing (attach)"
                    value={preview.summary.existingOperatorCount}
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
                  <OperatorImportPreviewTable
                    rows={preview.rows}
                    errors={preview.errors}
                  />
                )}

                {preview.errors.length > 0 && (
                  <div className="sleek-scroll max-h-48 overflow-y-auto rounded-[10px] border border-silver">
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
        <Link href="/operators" className="text-ember hover:underline">
          Back to operators
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
  tone?: "neutral" | "ok" | "danger";
}) {
  return (
    <div className="rounded-[10px] border border-silver bg-frost/40 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-steel">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-semibold ${
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
