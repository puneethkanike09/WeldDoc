"use client";

import { useCallback, useMemo, useState, useTransition, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { LocationSelect } from "@/components/app/location-select";
import { ID_METHODS } from "@/lib/iso9606/constants";
import { getWelderRegistrationFieldErrors } from "@/lib/iso9606/qualification-fields";
import { sliceNewPersonFormData } from "@/lib/qualify/group-session/participant-form";
import { runServerAction } from "@/lib/form-toast";
import { hasFieldErrors } from "@/lib/field-errors";
import type { FieldErrors } from "@/lib/field-errors";
import { nextPlantWelderIdSkipping } from "@/lib/welders/plant-id";
import { nextPlantOperatorIdSkipping } from "@/lib/operators/plant-id";
import { Plus, Search, Trash2, Users } from "lucide-react";

export interface PersonOption {
  id: string;
  full_name: string;
  plant_id: string | null;
}

type PersonKind = "welder" | "operator";

interface NewPersonRow {
  key: string;
  plantId: string;
  idMethod: string;
  dob: string;
  location: {
    country: string;
    state: string;
    district: string;
    combined: string;
  };
}

function newRowKey() {
  return `np_${Math.random().toString(36).slice(2, 10)}`;
}

function createNewRow(plantId: string): NewPersonRow {
  return {
    key: newRowKey(),
    plantId,
    idMethod: "Aadhar",
    dob: "",
    location: { country: "", state: "", district: "", combined: "" },
  };
}

function nextPlantIdForRow(
  kind: PersonKind,
  people: PersonOption[],
  newRows: NewPersonRow[],
  suggestedPlantId: string,
): string {
  const taken = [
    ...people.map((p) => p.plant_id).filter(Boolean),
    ...newRows.map((r) => r.plantId),
  ] as string[];
  return kind === "welder"
    ? nextPlantWelderIdSkipping(taken, suggestedPlantId)
    : nextPlantOperatorIdSkipping(taken, suggestedPlantId);
}

export function GroupParticipantsPanel({
  action,
  kind,
  people,
  orgDefaults,
  backHref,
  listHref,
}: {
  action: (fd: FormData) => Promise<void>;
  kind: PersonKind;
  people: PersonOption[];
  orgDefaults: {
    employer: string;
    branchLocation: string | null;
    suggestedPlantId: string;
  };
  backHref: string;
  listHref: string;
}) {
  const label = kind === "welder" ? "welder" : "operator";
  const plantField = kind === "welder" ? "welder_id" : "operator_id";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newRows, setNewRows] = useState<NewPersonRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.plant_id ?? "").toLowerCase().includes(q),
    );
  }, [people, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev.participants) return prev;
      const next = { ...prev };
      delete next.participants;
      return next;
    });
  };

  const validate = useCallback(
    (formData: FormData): FieldErrors => {
      const errors: FieldErrors = {};
      const existingCount = formData.getAll("existing_ids").length;
      const keys = formData
        .getAll("new_person_key")
        .map(String)
        .filter(Boolean);
      if (existingCount + keys.length === 0) {
        errors.participants = "Select or add at least one participant.";
        return errors;
      }
      for (const key of keys) {
        const slice = sliceNewPersonFormData(formData, key, plantField);
        const row = newRows.find((r) => r.key === key);
        const rowErrors = getWelderRegistrationFieldErrors(slice, "create", {
          dateOfBirth: row?.dob,
          country: row?.location.country,
          state: row?.location.state,
          district: row?.location.district,
        });
        for (const [k, msg] of Object.entries(rowErrors)) {
          errors[`${key}_${k}`] = msg;
        }
      }
      return errors;
    },
    [newRows, plantField],
  );

  const prepare = useCallback(
    (formData: FormData) => {
      formData.set("participant_count", String(selected.size + newRows.length));

      for (const row of newRows) {
        formData.set(`${row.key}_date_of_birth`, row.dob);
        formData.set(`${row.key}_${plantField}`, row.plantId);
        formData.set(`${row.key}_id_method`, row.idMethod);
        if (row.location.combined) {
          formData.set(`${row.key}_place_of_birth`, row.location.combined);
        }
        if (row.location.country) {
          formData.set(`${row.key}_country`, row.location.country);
        }
        if (row.location.state) {
          formData.set(`${row.key}_state`, row.location.state);
        }
        if (row.location.district) {
          formData.set(`${row.key}_district`, row.location.district);
        }
      }
      setFieldErrors({});
    },
    [newRows, selected.size, plantField],
  );

  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      prepare(formData);
      const errors = validate(formData);
      setFieldErrors(errors);
      if (hasFieldErrors(errors)) return;
      startTransition(() => {
        void runServerAction(action, formData);
      });
    },
    [action, validate, prepare],
  );

  const totalCount = selected.size + newRows.length;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      noValidate
      encType="multipart/form-data"
    >
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="existing_ids" value={id} />
      ))}
      {newRows.map((row) => (
        <input key={row.key} type="hidden" name="new_person_key" value={row.key} />
      ))}

      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Step 0 — Participants
            </h3>
            <p className="mt-1 text-[14px] text-graphite">
              Select existing {label}s and/or add new {label}s for this group
              qualification session.
            </p>
          </div>

          {fieldErrors.participants && (
            <p className="rounded-[10px] bg-ember/10 px-4 py-2 text-sm text-ember">
              {fieldErrors.participants}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-steel" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label}s by name or plant ID…`}
                className="max-w-md"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-[10px] border border-silver">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-sm text-steel">No matches.</p>
              ) : (
                filtered.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-silver/60 px-4 py-3 last:border-0 hover:bg-frost/50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="form-check"
                    />
                    <span className="font-medium text-charcoal">{p.full_name}</span>
                    {p.plant_id ? (
                      <span className="font-mono text-xs text-steel">{p.plant_id}</span>
                    ) : null}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-display text-sm font-semibold text-onyx">
                New {label}s
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setNewRows((rows) => [
                    ...rows,
                    createNewRow(
                      nextPlantIdForRow(kind, people, rows, orgDefaults.suggestedPlantId),
                    ),
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Add new {label}
              </Button>
            </div>
            {newRows.length === 0 ? (
              <p className="text-sm text-steel">
                No new {label}s added. Use the button above if someone is not yet
                in the registry.
              </p>
            ) : (
              newRows.map((row, index) => (
                <InlineNewPersonRow
                  key={row.key}
                  rowKey={row.key}
                  index={index}
                  kind={kind}
                  row={row}
                  orgDefaults={orgDefaults}
                  fieldErrors={fieldErrors}
                  onChange={(patch) =>
                    setNewRows((rows) =>
                      rows.map((r) => (r.key === row.key ? { ...r, ...patch } : r)),
                    )
                  }
                  onRemove={() =>
                    setNewRows((rows) => rows.filter((r) => r.key !== row.key))
                  }
                  clearError={(k) =>
                    setFieldErrors((prev) => {
                      if (!prev[k]) return prev;
                      const next = { ...prev };
                      delete next[k];
                      return next;
                    })
                  }
                />
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ButtonLink href={backHref} variant="ghost">
              Cancel
            </ButtonLink>
            <div className="flex items-center gap-3">
              <ButtonLink href={listHref} variant="ghost" size="sm">
                Session history
              </ButtonLink>
              <Button type="submit" disabled={pending || totalCount === 0}>
                <Users className="h-4 w-4" />
                Start group session ({totalCount})
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}

function InlineNewPersonRow({
  rowKey,
  index,
  kind,
  row,
  orgDefaults,
  fieldErrors,
  onChange,
  onRemove,
  clearError,
}: {
  rowKey: string;
  index: number;
  kind: PersonKind;
  row: NewPersonRow;
  orgDefaults: {
    employer: string;
    branchLocation: string | null;
    suggestedPlantId: string;
  };
  fieldErrors: FieldErrors;
  onChange: (patch: Partial<NewPersonRow>) => void;
  onRemove: () => void;
  clearError: (key: string) => void;
}) {
  const plantField = kind === "welder" ? "welder_id" : "operator_id";
  const plantLabel = kind === "welder" ? "Plant welder ID" : "Plant operator ID";
  const showOther =
    !ID_METHODS.includes(row.idMethod as (typeof ID_METHODS)[number]) ||
    row.idMethod === "Other";
  const invalidBorder = "border-ember ring-1 ring-ember/20";
  const err = (field: string) => fieldErrors[`${rowKey}_${field}`];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-onyx">
          New {kind} #{index + 1}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-ember" /> Remove
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Personal details
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" required error={err("full_name")}>
              <Input
                name={`${rowKey}_full_name`}
                placeholder="Alex Morgan"
                required
                className={cn(err("full_name") && invalidBorder)}
                onChange={() => clearError(`${rowKey}_full_name`)}
              />
            </Field>
            <Field
              label={plantLabel}
              hint="Auto-generated from your sequence. You can edit it — must be unique in your organisation."
              required
              error={err("welder_id") || err(plantField)}
            >
              <Input
                name={`${rowKey}_${plantField}`}
                value={row.plantId}
                placeholder={kind === "welder" ? "W#01" : "O#01"}
                required
                className={cn((err("welder_id") || err(plantField)) && invalidBorder)}
                onChange={(e) => {
                  onChange({ plantId: e.target.value });
                  clearError(`${rowKey}_welder_id`);
                  clearError(`${rowKey}_${plantField}`);
                }}
              />
            </Field>
            <Field label="Date of birth" required error={err("date_of_birth")}>
              <DatePicker
                name={`${rowKey}_date_of_birth`}
                value={row.dob}
                onChange={(v) => {
                  onChange({ dob: v });
                  clearError(`${rowKey}_date_of_birth`);
                }}
                placeholder="Select date of birth"
                required
                error={err("date_of_birth")}
              />
            </Field>
            <div className="sm:col-span-2">
              <LocationSelect
                name={`${rowKey}_place_of_birth`}
                initialValue=""
                required
                fieldErrors={{
                  country: err("country"),
                  state: err("state"),
                  district: err("district"),
                }}
                onValuesChange={(v) => {
                  onChange({ location: v });
                  clearError(`${rowKey}_country`);
                  clearError(`${rowKey}_state`);
                  clearError(`${rowKey}_district`);
                }}
              />
            </div>
            <Field label="ID method" required error={err("id_method")}>
              <Select
                name={`${rowKey}_id_method`}
                value={row.idMethod}
                required
                onChange={(e) => {
                  onChange({ idMethod: e.target.value });
                  clearError(`${rowKey}_id_method`);
                }}
                className={cn(err("id_method") && invalidBorder)}
              >
                {ID_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ID number" required error={err("id_number")}>
              <Input
                name={`${rowKey}_id_number`}
                placeholder="ID / passport no."
                required
                className={cn(err("id_number") && invalidBorder)}
                onChange={() => clearError(`${rowKey}_id_number`)}
              />
            </Field>
            {showOther && (
              <Field
                label="Specify ID method"
                className="sm:col-span-2"
                required
                error={err("id_method_other")}
              >
                <Input
                  name={`${rowKey}_id_method_other`}
                  placeholder="Other ID type"
                  className={cn(err("id_method_other") && invalidBorder)}
                  onChange={() => clearError(`${rowKey}_id_method_other`)}
                />
              </Field>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Employer &amp; photo
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Employer" required error={err("employer")}>
              <Input
                name={`${rowKey}_employer`}
                defaultValue={orgDefaults.employer}
                placeholder="Acme Fabrication Ltd"
                required
                className={cn(err("employer") && invalidBorder)}
                onChange={() => clearError(`${rowKey}_employer`)}
              />
            </Field>
            <Field label="Branch / site" required error={err("branch_location")}>
              <Input
                name={`${rowKey}_branch_location`}
                defaultValue={orgDefaults.branchLocation ?? ""}
                placeholder="Plant A / North Yard"
                required
                className={cn(err("branch_location") && invalidBorder)}
                onChange={() => clearError(`${rowKey}_branch_location`)}
              />
            </Field>
            <Field
              label="Photograph"
              className="sm:col-span-2"
              required
              error={err("photo")}
            >
              <FileDropzone
                name={`${rowKey}_photo`}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                error={err("photo")}
                placeholder="Drop photo here or click to browse (JPEG/PNG for certificate; PDF stored as document)"
                onFileSelect={() => clearError(`${rowKey}_photo`)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
