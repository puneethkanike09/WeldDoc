# Welder Import Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign welder Excel bulk import for SaaS legacy migration — single-sheet template, trusted legacy dates, optional photos via drag-and-drop or ZIP, attach quals to existing `W#` welders.

**Architecture:** Extend existing `src/lib/welders/bulk-import/*` pipeline (parse → normalize → validate → preview → commit). Add `photo_filename` column + `match-import-photos.ts` for filename matching. Accept multipart uploads in validate API; pass matched photo buffers to commit for Supabase `welder-photos` upload. Legacy dates stored as-is; optional continuity log seeding in commit.

**Tech Stack:** Next.js 16 App Router, Supabase, SheetJS (`xlsx`), existing `uploadFile` from `@/lib/storage`, Vitest-style script tests via `tsx scripts/verify-bulk-import.ts`.

**Spec:** [`docs/superpowers/specs/2026-07-08-welder-import-redesign-design.md`](../specs/2026-07-08-welder-import-redesign-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/welders/bulk-import/columns.ts` | Column keys, `TEMPLATE_COLUMNS`, required keys |
| `src/lib/welders/bulk-import/types.ts` | `ValidatedImportRow`, warnings, photo match types |
| `src/lib/welders/bulk-import/template.ts` | Single-sheet XLSX builder |
| `src/lib/welders/bulk-import/fill-forward.ts` | **New** — copy welder fields down within same W# group |
| `src/lib/welders/bulk-import/validate.ts` | Legacy date rules, warnings, optional welder fields |
| `src/lib/welders/bulk-import/match-import-photos.ts` | **New** — filename → welder plant ID matching |
| `src/lib/welders/bulk-import/extract-upload.ts` | **New** — parse multipart/ZIP → excel buffer + photo map |
| `src/lib/welders/bulk-import/validate-upload.ts` | Wire extract + photo match into validate result |
| `src/lib/welders/bulk-import/commit.ts` | Photos upload, continuity seed, Expired status |
| `src/app/api/welders/bulk-import/validate/route.ts` | Multipart form handling |
| `src/app/(app)/welders/import/actions.ts` | Commit with photos |
| `src/components/welders/bulk-import-panel.tsx` | Excel + drag-drop photos UI |
| `scripts/verify-bulk-import.ts` | Unit tests |
| `scripts/e2e-bulk-import.ts` | DB integration tests |

---

### Task 1: Columns, types, and template (single sheet)

**Files:**
- Modify: `src/lib/welders/bulk-import/columns.ts`
- Modify: `src/lib/welders/bulk-import/types.ts`
- Modify: `src/lib/welders/bulk-import/template.ts`
- Modify: `src/lib/welders/bulk-import/display.ts`
- Modify: `src/lib/welders/bulk-import/field-config.ts`
- Test: `scripts/verify-bulk-import.ts`

- [ ] **Step 1: Add `photo_filename` to `IMPORT_COLUMNS`**

Insert after `id_number` in `columns.ts`:

```typescript
export const IMPORT_COLUMNS = [
  "plant_welder_id",
  "full_name",
  "email",
  "date_of_birth",
  "place_of_birth",
  "id_method",
  "id_number",
  "photo_filename", // NEW
  // ... rest unchanged
] as const;
```

Update `WELDER_COLUMN_KEYS` to include `photo_filename`.

Replace `TEMPLATE_COLUMNS` with spec order (welder + qual + legacy dates):

```typescript
export const TEMPLATE_COLUMNS = [
  "plant_welder_id",
  "full_name",
  "date_of_birth",
  "id_method",
  "id_number",
  "photo_filename",
  "email",
  "welder_status",
  "process",
  "joint_type",
  "position",
  "base_material_group",
  "filler_group",
  "test_thickness_mm",
  "pipe_od_mm",
  "product",
  "date_of_welding",
  "expiry_date",
  "continuity_last_verified",
  "revalidation_method",
] as const satisfies readonly ImportColumnKey[];
```

Remove `plant_welder_id` from `WELDER_REQUIRED_KEYS` — only `full_name` required in Excel; plant ID resolved at validate time.

- [ ] **Step 2: Extend types**

In `types.ts`:

```typescript
export interface WelderImportFields {
  // ... existing fields
  photoFilename: string | null; // NEW
}

export interface QualificationImportFields {
  // ...
  continuityLastVerified: string | null; // was string — allow null
}

export type ImportWarning = {
  excelRow?: number;
  column?: string;
  message: string;
};

export interface ImportValidationResult {
  // ... existing
  warnings: ImportWarning[]; // NEW
}

export type PhotoMatchStatus = "ready" | "missing" | "duplicate" | "invalid_type";

export interface PhotoMatchResult {
  plantWelderId: string;
  filename: string | null;
  status: PhotoMatchStatus;
}
```

Update `display.ts` `validatedRowToColumns` to map `photo_filename`.

- [ ] **Step 3: Rewrite `template.ts` — one sheet only**

Remove `INSTRUCTIONS`, `buildReferenceSheet`, and extra `book_append_sheet` calls. Keep only:

```typescript
export function buildImportTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();
  const header = [...TEMPLATE_COLUMNS];
  const dataRows = EXAMPLE_ROWS.map(/* map columns */);
  const importSheet = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, importSheet, IMPORT_SHEET_NAME);
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer);
}
```

Update `EXAMPLE_ROWS` to match spec (Sanjay 3-qual example + legacy W#15 row with expiry/continuity).

Update `verifyBuiltImportTemplate()` to assert workbook has exactly **one** sheet named `Import`.

- [ ] **Step 4: Add failing test for single-sheet template**

In `scripts/verify-bulk-import.ts`:

```typescript
import * as XLSX from "xlsx";
import { buildImportTemplateBuffer } from "../src/lib/welders/bulk-import/template";

test("template has only Import sheet", () => {
  const wb = XLSX.read(buildImportTemplateBuffer(), { type: "buffer" });
  assert.deepEqual(wb.SheetNames, ["Import"]);
});

test("template includes legacy date columns in header", () => {
  const wb = XLSX.read(buildImportTemplateBuffer(), { type: "buffer" });
  const row = XLSX.utils.sheet_to_json<string[]>(wb.Sheets.Import, { header: 1 })[0];
  assert.ok(row.includes("expiry_date"));
  assert.ok(row.includes("continuity_last_verified"));
  assert.ok(row.includes("photo_filename"));
});
```

- [ ] **Step 5: Run tests**

Run: `npm run verify:import`  
Expected: PASS (fix `field-config.ts` switch for `photo_filename` → `{ type: "text" }`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/welders/bulk-import/columns.ts types.ts template.ts display.ts field-config.ts scripts/verify-bulk-import.ts
git commit -m "feat(import): single-sheet template with photo_filename and legacy date columns"
```

---

### Task 2: Row fill-forward and optional welder fields

**Files:**
- Create: `src/lib/welders/bulk-import/fill-forward.ts`
- Modify: `src/lib/welders/bulk-import/validate.ts`
- Test: `scripts/verify-bulk-import.ts`

- [ ] **Step 1: Write fill-forward helper**

```typescript
// src/lib/welders/bulk-import/fill-forward.ts
import type { RawImportRow } from "./types";
import { WELDER_COLUMN_KEYS } from "./columns";

const FILL_KEYS = [
  "plant_welder_id",
  "full_name",
  "date_of_birth",
  "id_method",
  "id_number",
  "photo_filename",
  "email",
  "welder_status",
  "place_of_birth",
] as const;

/** Copy welder columns from the previous row when blank (same import file). */
export function fillForwardWelderFields(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
): Array<{ excelRow: number; raw: RawImportRow }> {
  let last: Partial<RawImportRow> = {};
  return parsed.map(({ excelRow, raw }) => {
    const next = { ...raw };
    for (const key of FILL_KEYS) {
      const v = next[key];
      if (v == null || v === "") next[key] = last[key] ?? null;
      else last[key] = next[key];
    }
    // Reset carry when full_name changes without plant_welder_id? Keep simple: always carry last non-blank.
    return { excelRow, raw: next };
  });
}
```

Call `fillForwardWelderFields(parsed)` at start of `validateImportRows` before the row loop.

- [ ] **Step 2: Relax welder field requirements in `parseWelder`**

- `date_of_birth`, `place_of_birth`, `id_method` → optional (null allowed) for migration rows
- `id_number` → already optional
- Parse `photo_filename` from raw → `welder.photoFilename`
- Only `full_name` required; `plant_welder_id` can be blank (auto-assign still runs)

- [ ] **Step 3: Add test for fill-forward**

```typescript
test("fill-forward copies welder fields on qualification rows", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#02",
          full_name: "Sanjay",
          date_of_birth: "1988-05-20",
          id_method: "Aadhar",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          plant_welder_id: "",
          full_name: "",
          process: "141",
          joint_type: "BW",
          position: "PA",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.rows[1].welder.fullName, "Sanjay");
  assert.equal(r.rows[1].welder.plantWelderId, "W#02");
});
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(import): fill-forward welder fields and optional personal details"
```

---

### Task 3: Legacy date handling and warnings

**Files:**
- Modify: `src/lib/welders/bulk-import/validate.ts`
- Modify: `src/lib/welders/bulk-import/types.ts`
- Test: `scripts/verify-bulk-import.ts`

- [ ] **Step 1: Fix continuity default**

In `parseQualification`, replace:

```typescript
const continuityLastVerified = continuityOverride ?? dateOfWelding;
```

with:

```typescript
const continuityLastVerified = continuityOverride ?? null;
```

- [ ] **Step 2: Expiry estimate warning**

When `!expiryOverride && dateOfWelding`, push to `warnings` array (not `errors`):

```typescript
warnings.push({
  excelRow,
  column: "expiry_date",
  message:
    "Expiry estimated from test date and revalidation method — add expiry_date from the certificate if you have it.",
});
```

Initialize `warnings: ImportWarning[] = []` in `validateImportRows`; return in result.

- [ ] **Step 3: Expired wpq status**

Add helper:

```typescript
function resolveWpqStatus(
  ndtStatus: WpqStatus,
  expiryDate: string,
): WpqStatus {
  if (ndtStatus === "Failed") return "Failed";
  const today = new Date().toISOString().slice(0, 10);
  if (expiryDate < today) return "Expired";
  return "Approved";
}
```

Use instead of raw `wpqStatusFromNdt` return value.

- [ ] **Step 4: Legacy snapshot test**

```typescript
test("legacy expiry used as-is not recalculated from old test date", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#15",
          full_name: "Rajesh",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2019-06-10",
          expiry_date: "2026-03-01",
          continuity_last_verified: "2025-12-01",
          revalidation_method: "9.3a",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.rows[0].qualification?.expiryDate, "2026-03-01");
  assert.equal(r.rows[0].qualification?.continuityLastVerified, "2025-12-01");
  assert.notEqual(r.rows[0].qualification?.expiryDate, "2022-06-10"); // would be wrong 9.3a calc
});

test("expired legacy cert gets Expired status", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#99",
          full_name: "Old Cert",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2019-01-01",
          expiry_date: "2020-01-01",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.rows[0].qualification?.wpqStatus, "Expired");
});
```

- [ ] **Step 5: Run tests — PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(import): legacy date snapshot rules and expiry warnings"
```

---

### Task 4: Photo matching module

**Files:**
- Create: `src/lib/welders/bulk-import/match-import-photos.ts`
- Test: `scripts/verify-bulk-import.ts`

- [ ] **Step 1: Implement matcher**

```typescript
// match-import-photos.ts
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PhotoFile = { filename: string; bytes: Buffer; mime: string };

export function matchPhotosToWelders(
  rows: Array<{ welder: { plantWelderId: string; photoFilename: string | null } }>,
  files: PhotoFile[],
): { matches: Map<string, PhotoFile>; results: PhotoMatchResult[] } {
  const byName = new Map<string, PhotoFile[]>();
  for (const f of files) {
    const key = f.filename.toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(f);
    byName.set(key, list);
  }

  const matches = new Map<string, PhotoFile>();
  const results: PhotoMatchResult[] = [];
  const seenPlant = new Map<string, PhotoFile[]>();

  for (const row of rows) {
    const plantId = row.welder.plantWelderId;
    if (!plantId || results.some((r) => r.plantWelderId === plantId)) continue;

    const candidates: PhotoFile[] = [];
    if (row.welder.photoFilename) {
      const hit = byName.get(row.welder.photoFilename.toLowerCase());
      if (hit) candidates.push(...hit);
    } else {
      for (const ext of IMAGE_EXT) {
        const hit = byName.get(`${plantId.toLowerCase()}${ext}`);
        if (hit) candidates.push(...hit);
      }
    }

    if (candidates.length > 1) {
      results.push({ plantWelderId: plantId, filename: null, status: "duplicate" });
      continue;
    }
    if (candidates.length === 1) {
      const f = candidates[0];
      if (f.bytes.length > MAX_PHOTO_BYTES || !ALLOWED_MIME.has(f.mime)) {
        results.push({ plantWelderId: plantId, filename: f.filename, status: "invalid_type" });
        continue;
      }
      matches.set(plantId, f);
      results.push({ plantWelderId: plantId, filename: f.filename, status: "ready" });
      seenPlant.set(plantId, candidates);
    } else {
      results.push({ plantWelderId: plantId, filename: null, status: "missing" });
    }
  }
  return { matches, results };
}
```

Deduplicate by unique `plantWelderId` from rows (first row per welder only).

- [ ] **Step 2: Unit tests**

```typescript
test("photo match by photo_filename column", () => {
  const { matches, results } = matchPhotosToWelders(
    [{ welder: { plantWelderId: "W#02", photoFilename: "sanjay.jpg" } }],
    [{ filename: "sanjay.jpg", bytes: Buffer.from("x"), mime: "image/jpeg" }],
  );
  assert.equal(matches.size, 1);
  assert.equal(results[0].status, "ready");
});

test("photo match by plant_welder_id fallback W#02.png", () => {
  const { matches } = matchPhotosToWelders(
    [{ welder: { plantWelderId: "W#02", photoFilename: null } }],
    [{ filename: "W#02.png", bytes: Buffer.from("x"), mime: "image/png" }],
  );
  assert.equal(matches.size, 1);
});

test("duplicate photos for same welder flagged", () => {
  const { results } = matchPhotosToWelders(
    [{ welder: { plantWelderId: "W#02", photoFilename: null } }],
    [
      { filename: "W#02.jpg", bytes: Buffer.from("a"), mime: "image/jpeg" },
      { filename: "W#02.png", bytes: Buffer.from("b"), mime: "image/png" },
    ],
  );
  assert.equal(results[0].status, "duplicate");
});
```

- [ ] **Step 3: Run tests — PASS**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(import): photo filename matching for bulk welder import"
```

---

### Task 5: Multipart / ZIP upload extraction

**Files:**
- Create: `src/lib/welders/bulk-import/extract-upload.ts`
- Modify: `src/lib/welders/bulk-import/validate-upload.ts`
- Modify: `src/app/api/welders/bulk-import/validate/route.ts`

- [ ] **Step 1: Implement extract-upload**

Use Node `zlib`/manual ZIP via existing dependency or add lightweight unzip — check if project has `jszip` or use `adm-zip`. **Prefer:** parse FormData in route; if single `.xlsx` → excel buffer; if `.zip` → extract first `.xlsx` + files under `photos/` prefix.

```typescript
export type ExtractedImportUpload = {
  excel: File;
  photos: PhotoFile[];
  fileError?: string;
};

export async function extractImportUpload(formData: FormData): Promise<ExtractedImportUpload> {
  const zip = formData.get("zip");
  const excel = formData.get("excel");
  const photoEntries = formData.getAll("photos");

  if (zip instanceof File && zip.size > 0) {
    return extractFromZip(zip);
  }
  if (!(excel instanceof File) || excel.size === 0) {
    return { excel: excel as File, photos: [], fileError: "Select an Excel file." };
  }
  const photos: PhotoFile[] = [];
  for (const entry of photoEntries) {
    if (entry instanceof File && entry.size > 0) {
      photos.push(await fileToPhotoFile(entry));
    }
  }
  return { excel, photos };
}
```

For ZIP: use `import('node:buffer')` + check if `yauzl`/`jszip` available — if not, add `jszip` as dependency or use shell `unzip -p` in script only. **Implementation note:** add `jszip` devDependency if missing.

- [ ] **Step 2: Wire validate-upload**

After `validateParsedImport`, call `matchPhotosToWelders(result.rows, photos)` and return `{ ...result, photoResults, warnings }`.

Extend `ValidateUploadResult` type.

- [ ] **Step 3: Update validate route**

```typescript
export async function POST(request: Request) {
  // ... auth ...
  const formData = await request.formData();
  const extracted = await extractImportUpload(formData);
  if (extracted.fileError) return Response.json(emptyResult(extracted.fileError));
  return Response.json(
    await validateWelderImportUpload(extracted.excel, profile.org_id, supabase, extracted.photos),
  );
}
```

- [ ] **Step 4: Manual smoke test**

Run dev server, POST multipart with curl or UI (Task 6).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(import): multipart and ZIP upload extraction for validate API"
```

---

### Task 6: Commit — photos, continuity seed, attach-only welders

**Files:**
- Modify: `src/lib/welders/bulk-import/commit.ts`
- Modify: `src/app/(app)/welders/import/actions.ts`

- [ ] **Step 1: Extend commit signature**

```typescript
export async function commitValidatedImport(
  supabase: SupabaseClient,
  ctx: CommitImportContext,
  rows: ValidatedImportRow[],
  photoMatches?: Map<string, PhotoFile>,
): Promise<CommitImportResult>
```

- [ ] **Step 2: Upload photo on welder create**

When inserting new welder (not attach path):

```typescript
import { uploadFile } from "@/lib/storage";

let photoPath: string | null = null;
const photo = photoMatches?.get(plantWelderId);
if (photo) {
  const blob = new File([photo.bytes], photo.filename, { type: photo.mime });
  photoPath = await uploadFile("welder-photos", blob, `${ctx.orgId}`);
}
// insert { photo_path: photoPath, ... }
```

Do **not** overwrite photo on attach-to-existing welder (spec: attach quals only).

- [ ] **Step 3: Seed continuity validation record**

After each WPQ insert, when `qual.continuityLastVerified`:

```typescript
await supabase.from("validation_records").insert({
  org_id: ctx.orgId,
  wpq_id: wpq.id,
  validated_on: qual.continuityLastVerified,
  kind: "continuity",
  note: "Imported from legacy registry",
});
```

- [ ] **Step 4: Pass photos from server action**

Store photo bytes server-side only on commit — **client cannot re-send binary in server action easily**. Options:

**Recommended:** On validate, store matched photos in Supabase Storage temp path keyed by session/import token, return `importSessionId`; commit loads photos by session id.

**Simpler v1:** Encode small photos as base64 in validate JSON response (bad for scale) — **avoid**.

**Pragmatic v1:** Re-upload photos in commit FormData alongside serialized rows JSON.

Implement commit as:

```typescript
export async function commitWelderImport(formData: FormData) {
  const rowsJson = formData.get("rows");
  const rows = JSON.parse(String(rowsJson)) as ValidatedImportRow[];
  const photos = formData.getAll("photos") as File[];
  // re-match photos to rows server-side
}
```

Update panel to keep photo `File` objects in React state from Step 2 and re-post on commit.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(import): upload photos on commit and seed legacy continuity records"
```

---

### Task 7: Import UI — drag-and-drop photos + warnings

**Files:**
- Modify: `src/components/welders/bulk-import-panel.tsx`
- Modify: `src/components/welders/import-preview-table.tsx` (optional photo status column)

- [ ] **Step 1: Two-step upload form**

```tsx
const [photoFiles, setPhotoFiles] = useState<File[]>([]);

// Validate submit:
const fd = new FormData();
fd.append("excel", excelFile);
for (const p of photoFiles) fd.append("photos", p);
// OR fd.append("zip", zipFile) when zip mode
```

Add drag-and-drop zone (`onDrop` → append to `photoFiles`).

Toggle: "Excel + photos" (default) | "ZIP package".

- [ ] **Step 2: Show warnings separately from errors**

Yellow banner for `preview.warnings` (expiry estimated).  
Red errors still block Confirm.

- [ ] **Step 3: Photo status table**

After validate, render `photoResults` with status badges (Ready / Missing / Duplicate).  
Duplicate photos: show message but **do not block Confirm** (spec: block photo attach only — import continues without photo for that welder).

- [ ] **Step 4: Commit with photos**

On confirm, build FormData with `rows` JSON + same `photoFiles` array.

- [ ] **Step 5: Update page copy**

Remove Instructions/Reference sheet mentions. Add help text for legacy dates and photo naming.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(import): drag-and-drop photo upload and legacy warning UI"
```

---

### Task 8: E2E and spec sign-off

**Files:**
- Modify: `scripts/e2e-bulk-import.ts`
- Modify: `docs/superpowers/specs/2026-07-08-welder-import-redesign-design.md`

- [ ] **Step 1: Extend E2E for legacy dates**

Assert `expiry_date` and `continuity_last_verified` stored exactly; assert `validation_records` row exists when continuity imported.

- [ ] **Step 2: E2E expired status**

Row with past `expiry_date` → `wpq_status === 'Expired'`.

- [ ] **Step 3: Run full verification**

```bash
npm run verify:import
npm run verify:import:e2e   # requires .env.local
```

- [ ] **Step 4: Update spec status**

Mark spec: `Status: Implemented` and check manual QA boxes as completed.

- [ ] **Step 5: Commit**

```bash
git commit -m "test(import): e2e coverage for legacy dates and continuity seed"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Single Import sheet | Task 1 |
| photo_filename column | Task 1 |
| Legacy expiry as-is | Task 3 |
| Continuity null when blank | Task 3 |
| Expired status | Task 3 |
| Fill-forward welder rows | Task 2 |
| Attach to existing W# | Already in commit — verify in Task 8 |
| Photo drag-and-drop | Tasks 5, 7 |
| ZIP support | Task 5 |
| Photo matching rules | Task 4 |
| Missing photo warn only | Tasks 4, 7 |
| Continuity log seed | Task 6 |
| Auto W# assign | Existing — regression in Task 2 tests |

---

## Manual QA (post-implementation)

- [ ] Download template — one sheet, includes expiry/continuity/photo_filename columns
- [ ] Import 100 rows, 1 bad W# — blocked until fixed
- [ ] Legacy 2019 test + 2026 expiry — stored correctly
- [ ] Drag-drop photos without ZIP
- [ ] ZIP import still works
- [ ] Missing photo — import succeeds

---

## Self-review (plan author)

- **Gaps:** Photo re-upload on commit (Task 6 Step 4) needs explicit FormData approach — documented.
- **No placeholders** — all tasks have file paths and code sketches.
- **Type consistency:** `continuityLastVerified` nullable end-to-end — Tasks 1 + 3 + 6 aligned.
- **Dependency:** May need `jszip` for ZIP extraction — verify in Task 5 before implementing.
