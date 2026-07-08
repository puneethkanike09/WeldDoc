# Welder Excel Import Redesign — Design Spec

**Date:** 2026-07-08  
**Status:** Implemented  
**Spec reviewed by engineering:** 2026-07-08

---

## Problem

Clients migrating existing welders need a **single, simple Excel sheet** plus optional photos. Legacy certificates carry **snapshot dates** (test date, current expiry, last continuity) that must not be recalculated from original test dates. The current template uses three worksheets and omits key welder/legacy columns from the downloadable sheet. Photo import via ZIP-only UX is too heavy for many fabrication-shop users.

New-customer qualify flow works correctly; **legacy Excel import** is the gap.

---

## Goals

1. **One worksheet** (`Import`) in the downloadable template — no Instructions or Reference tabs.
2. **Welder + qualification columns** aligned with client registry data, including legacy date fields.
3. **Trust imported dates** for expiry and continuity — no synthetic 5-year history.
4. **Photo import** via filename matching with **Excel + drag-and-drop** as primary UX; ZIP as optional.
5. **Org-scoped SaaS** — all validation and inserts remain per-organisation.
6. **Fail early on Excel errors**; **warn only on photo gaps** — do not block import for missing photos.

## Non-goals (v1)

- Embedded “picture in cell” Excel photo extraction
- Reconstructing historical continuity/revalidation log entries between test date and today
- New plant ID format (e.g. `WD-000125`) — keep existing `W#01` scheme
- Updating existing welder personal details via import (attach quals only when W# exists)
- Full WPQ wizard parity (WPS, examiner, signed PDFs) in Excel

---

## Template — single `Import` sheet

Documentation lives on `/welders/import` in the app, not in Excel.

### Column order

**Welder fields** (repeat on every qualification row; may be blank on rows 2+ for the same welder — importer copies forward internally for validation grouping):

| Column | Required | Notes |
|--------|----------|-------|
| `plant_welder_id` | Resolved before confirm | `W#02`, `2`, `W#2`. Blank → auto-assign next free `W#…` in preview. If exists in org → attach qual to that welder. |
| `full_name` | Yes | |
| `date_of_birth` | Yes on first row per welder | Flexible date parsing (ISO, `DD/MM/YYYY`, etc.) |
| `id_method` | Yes on first row per welder | Passport, Aadhar, ID Card, custom label |
| `id_number` | No | Optional |
| `photo_filename` | No | e.g. `W#02.jpg` — not a path or URL |
| `email` | No | |
| `welder_status` | No | Active / Inactive / Suspended (default Active) |

**Qualification fields** (one row = one WPQ; leave all blank for welder-only registration):

| Column | Required when importing quals | Notes |
|--------|-------------------------------|-------|
| `process` | Yes | Lenient coercion (e.g. `MAG (135)`, `SMAW`) |
| `joint_type` | Yes | BW / FW |
| `position` | Yes | Test position; range computed by engine |
| `base_material_group` | Yes | 1–11 |
| `filler_group` | No | Default FM1 |
| `test_thickness_mm` | Yes | |
| `deposited_thickness_mm` | No | |
| `pipe_od_mm` | No | Pipe/branch tests |
| `product` | Yes | Plate / Pipe / Branch / Other |
| `testing_standard` | No | Default EN ISO 9606-1:2017 |
| `date_of_welding` | Yes | Original test date (historical) |
| `expiry_date` | Strongly recommended for legacy | **Used as-is when provided** |
| `continuity_last_verified` | Strongly recommended for legacy | **Used as-is when provided** |
| `revalidation_method` | Yes | 9.3a / 9.3b / 9.3c — governs **future** renewals |
| `result_vt` / `result_rt_ut` / `result_fracture` | No | Pass / Fail / NA |

Extra columns in client files are **ignored** (lenient header matching). Missing optional columns → empty.

### Example rows

**One welder, three qualifications:**

| plant_welder_id | full_name | date_of_birth | id_method | id_number | photo_filename | process | … | date_of_welding | expiry_date | continuity_last_verified | revalidation_method |
|-----------------|-----------|---------------|-----------|-----------|----------------|---------|---|-----------------|-------------|--------------------------|---------------------|
| W#02 | Sanjay Yadav | 1988-05-20 | Aadhar | 1234… | W#02.jpg | 136 | … | 2025-08-19 | 2027-08-19 | 2026-01-15 | 9.3b |
| W#02 | Sanjay Yadav | | | | | 135 | … | 2025-08-19 | 2027-08-19 | 2026-01-15 | 9.3b |
| W#02 | Sanjay Yadav | | | | | 121 | … | 2026-02-25 | 2028-02-25 | 2026-01-15 | 9.3b |

**Legacy snapshot (5+ year old cert, current validity):**

| plant_welder_id | full_name | date_of_welding | expiry_date | continuity_last_verified | revalidation_method |
|-----------------|-----------|-----------------|-------------|--------------------------|---------------------|
| W#15 | Rajesh Kumar | 2019-06-10 | 2026-03-01 | 2025-12-01 | 9.3a |

---

## Legacy date handling

### Principle: snapshot migration

Import stores **current certificate state** from the client spreadsheet. Do not fabricate intermediate continuity/revalidation history.

| Field | Import rule |
|-------|-------------|
| `date_of_welding` | Historical original test date |
| `expiry_date` | If provided → store **exactly**; do **not** call `computeExpiry()` |
| `expiry_date` blank | Compute from `date_of_welding` + `revalidation_method`; show preview **warning**: “Expiry estimated — add expiry_date from certificate if available.” |
| `continuity_last_verified` | If provided → store exactly; do **not** default to test date |
| `continuity_last_verified` blank | Leave null; no continuity alerts until set or logged in app |
| `revalidation_method` | Stored for future `extendExpiry()` when engineer logs revalidation in UI |

### Status after import

- NDT fail on row → `wpq_status = Failed`
- `expiry_date` in the past → `wpq_status = Expired`
- `expiry_date` in the future + pass → `Approved`
- Cron alerts use imported `expiry_date` and `continuityDue(continuity_last_verified)` — same as live welders

### Continuity log seeding (optional single row)

When `continuity_last_verified` is provided on import, insert **one** `validation_records` row:

- `kind = continuity`
- `validated_on = continuity_last_verified`
- `note = "Imported from legacy registry"`
- No supporting document unless added later

Do **not** generate synthetic 6-month entries between test date and today.

---

## Plant welder ID

- Format: **`W#01`, `W#02`, …** (existing WeldDoc convention)
- Blank in Excel → auto-assign in validation preview using org’s taken IDs + `welder_seq`
- Explicit ID already in org → **attach** new qualification rows to existing welder; do not create duplicate welder
- Explicit ID conflict (same W#, different person in file) → validation error; **whole batch blocked** until fixed
- Duplicate `id_number` in org or within file (different people) → validation error

---

## Photo import

### v1 approach: filename matching (not embedded cell images)

**Primary UX — multipart upload:**

```
POST validate / commit
  - file: import.xlsx (required)
  - photos[]: optional multiple image files (drag-and-drop)
```

**Alternative UX — ZIP package (power users):**

```
  - file: migration.zip
    ├── import.xlsx (or first .xlsx)
    └── photos/*.jpg|png|webp
```

Backend normalises both to the same internal structure: `{ excelBuffer, photoFiles: Map<filename, Buffer> }`.

### Matching priority

1. **`photo_filename` column** if filled (exact filename match, case-insensitive)
2. Else **`{plant_welder_id}.jpg`** then try `.png`, `.jpeg`, `.webp`
3. Multiple files for same welder → validation warning/error on photo step: “Multiple images for W#02 — keep one”; block photo attach until resolved (do not block Excel import if user chooses continue without photo)

### Photo validation rules

| Case | Behaviour |
|------|-----------|
| Photo missing | ⚠ Warning — import continues |
| Photo found | Upload to `welder-photos` bucket; set `photo_path` on welder create only (first row per welder) |
| Wrong type (PDF, etc.) | Reject that file only |
| Size | Max 10 MB per file; resize/compress server-side (~1024px long edge) like Add welder |
| Duplicate extensions for same W# | User must resolve before attach |

### Preview

Show thumbnail when matched; status column: Ready / Missing (continue) / Duplicate (fix).

### Explicitly out of scope v1

Parsing Excel embedded drawings / “Insert picture in cell”.

---

## Validation and commit flow

```
1. User uploads Excel (+ optional photos or ZIP)
2. Parse Import sheet (lenient headers, max 1000 rows)
3. Validate all rows — collect ALL errors
4. Assign preview plant IDs for blanks
5. Match photos — collect photo warnings
6. Preview table + error list + photo thumbnails
7. If any Excel validation errors → hide Confirm
8. If Excel OK → Confirm allowed (even with photo warnings)
9. Commit: re-validate server-side → create/attach welders → legacy quals → ranges → NDT → photos → optional continuity seed
10. Rollback all inserts on commit failure
```

---

## UI changes (`/welders/import`)

- Remove references to Instructions/Reference sheets in copy
- Step 1: Upload Excel
- Step 2 (optional): Drag-and-drop photos **or** ZIP toggle
- Download template → single-sheet `welddoc-welder-import-template.xlsx`
- Preview: legacy date warnings, photo thumbnails, auto-assigned W# column
- Help panel on page: column definitions, legacy date guidance, photo naming rules

---

## Data model mapping (unchanged tables)

**`welders`:** `welder_id`, `full_name`, `date_of_birth`, `id_method`, `id_number`, `email`, `status`, `photo_path`, `employer`/`branch_location` from org, `is_new_welder` false when qual imported.

**`qualification_records`:** qual columns + `is_legacy: true`, imported dates, `standard: ISO_9606_1`.

**`ndt_dt_records`:** from result columns when not NA.

**`ranges_of_approval`:** `recomputeWpqRange()` after insert.

**`validation_records`:** one seeded continuity row when `continuity_last_verified` imported.

---

## Testing

### Unit (`npm run verify:import`)

- Template round-trip (single sheet parses)
- Legacy dates used as-is; estimate + warning when expiry blank
- Auto plant ID assignment
- Attach qual to existing W#
- Duplicate plant ID / id_number rejection
- Photo filename normalisation (matching logic in isolation)

### E2E (`npm run verify:import:e2e`)

- Import with explicit expiry + continuity → correct DB fields + alert eligibility
- Import with photo multipart → `photo_path` set
- Expired cert → `wpq_status = Expired`

### Manual QA checklist

- [ ] Download template — one sheet only
- [ ] 100 rows, 1 duplicate W# → batch blocked, fix → all import
- [ ] Legacy row with 2019 test date + 2026 expiry → expiry not recalculated
- [ ] Drag-drop photos without ZIP
- [ ] ZIP upload still works
- [ ] Missing photo → import succeeds, profile shows no photo

---

## Migration notes for existing code

| Area | Change |
|------|--------|
| `template.ts` | Single sheet; full column set including legacy dates + `photo_filename` |
| `columns.ts` | Rename/add `photo_filename`; template columns list updated |
| `validate.ts` | Expiry: prefer override; continuity: no test-date default when legacy column expected; warnings |
| `commit.ts` | Seed continuity record; attach-to-existing welder; photo upload on create |
| `validate-upload.ts` | Accept multipart photos / ZIP |
| `bulk-import-panel.tsx` | Two-step upload UI, photo preview |
| `parse.ts` | Already lenient — keep |

---

## Open decisions (resolved)

| Question | Decision |
|----------|----------|
| Legacy expiry | Trust `expiry_date` when provided |
| 5-year history | Snapshot only + optional one continuity log |
| Photo in cell | Deferred; filename + drag-drop v1 |
| Plant ID format | Keep `W#…` |
| Missing photos | Warn, do not block |
| ZIP | Supported as alternate input |

---

## Approval

- [x] Product / stakeholder confirmed 2026-07-08
- [x] Spec reviewed by engineering
- [x] Implementation plan: [`docs/superpowers/plans/2026-07-08-welder-import-redesign.md`](../plans/2026-07-08-welder-import-redesign.md)
