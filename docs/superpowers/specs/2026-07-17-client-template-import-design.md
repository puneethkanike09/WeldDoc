# Client Excel Template Import (Option A)

**Date:** 2026-07-17  
**Status:** Draft — awaiting user approval before implementation  
**Source file:** `welddoc-welder-import-template_2.xlsx` (client-provided)

## Goal

Accept the **exact client Import sheet** (18 columns) for legacy welder bulk import, store dual-process / BW+FW rows the **same way the qualify wizard already does**, and meet the client’s stated inputs/outputs — without inventing blank cell values.

## Decision locked

**Option A — one Excel row → one `qualification_records` row**

- Multi-process: `process` + `process_2` (e.g. `136+135` → `136` / `135`)
- BW+FW: `joint_type = 'BW'` + supplementary fillet fields (never store `joint_type = 'BW/FW'`; display derives `BW/FW`)
- Single-process FW-only (e.g. Rajesh `141` + `FW`): normal single-process row, `process_2` null, no supplementary fillet required

This matches existing schema (`0021_multi_process`, supplementary fillet columns), qualify UI, master list, certificates, and `scripts/verify-multi-process.ts`.

## Client template (exact headers)

| # | Header | Maps to |
|---|--------|---------|
| 1 | `welder_id` | Plant W# (`welder_id` / plant id) |
| 2 | `full_name` | Welder name |
| 3 | `date_of_birth` | DOB |
| 4 | `id_method` | ID method |
| 5 | `id_number` | ID number (numeric Excel OK) |
| 6 | `photo_filename` | Optional photo match |
| 7 | `process` | `136`, `141`, or `136+135` |
| 8 | `joint_type` | `BW`, `FW`, or `BW/FW` |
| 9 | `BW position` | BW position(s); `NA` = unused |
| 10 | `FW position` | FW position(s); `NA` = unused |
| 11 | `filler_group` | Filler (apply to process 1; process 2 defaults same unless later extended) |
| 12 | `BW test_thickness_mm` | BW thickness → deposited / test thickness as appropriate; `NA` = unused |
| 13 | `FW test_thickness_mm` | FW / supplementary fillet thickness; `NA` = unused |
| 14 | `pipe_od_mm` | Optional OD |
| 15 | `revalidation_method` | `9.3a` / `9.3b` / `9.3c` |
| 16 | `Weld Test/ Re validation Date` | `date_of_welding` |
| 17 | `Validation expiry_date` | `expiry_date` (store as-is) |
| 18 | `continuity_last_verified` | May contain **multiple** dates (`;` or `,`) → parse to history + latest for snapshot |

**Removed from downloadable client-facing template** (vs old WeldDoc template): separate `continuity_history` / `revalidation_history` columns, `plant_welder_id` rename, single `position` / `test_thickness_mm`, required `base_material_group` / `product` as Excel columns.

**DB defaults when Excel omits fields the DB still needs** (not shown to client): e.g. material group / product / testing standard — use safe defaults documented in implementation (same as sensible qualify defaults), never copy from previous Excel row.

## Mapping rules (Option A)

### Process
- `141` → `process=141`, `process_2=null`
- `136+135` → `process=136`, `process_2=135` (order preserved as written)
- Reject unknown codes

### Joint + positions + thickness
| Excel | Storage |
|-------|---------|
| `BW` only | `joint_type=BW`; BW position → `position` (+ `position_2` if dual process); BW thickness → deposited / thickness fields |
| `FW` only | `joint_type=FW`; FW position → `position`; FW thickness → `test_thickness_mm` |
| `BW/FW` | `joint_type=BW` + supplementary fillet true; BW cols → BW fields; FW cols → `supplementary_fillet_*` (and `_2` when `process_2` set, using same FW position/thickness for both processes unless Excel later adds per-process FW cols) |
| `NA` | Treat as empty for that side |

### Continuity
- Split `continuity_last_verified` cell on `;` / `,`
- All valid dates → `validation_records` (`kind=continuity`) + internal history list
- Snapshot `continuity_last_verified` on WPQ = **latest** parsed date (client put all dates in that one column)
- Blank cell → null / no records (no invent)

### Dates
- Accept Excel dates and `DD-MMM-YY` style
- Expiry stored exactly; no recalc when provided
- Blank stays blank (except expiry estimate warning only if expiry missing and we must compute for status — prefer requiring client expiry for legacy)

### Blank cells
- **No fill-forward from previous rows**
- Repeat `welder_id` + `full_name` on every row for multi-certificate welders

### Photos
- Unchanged: filename column or `W#xx.jpg` matching; optional; missing OK

## Client requirements (from Excel notes)

### Input
1. Excel in this template shape  
2. **Later / Phase 2:** 1 already-qualified certificate PDF + up to 10 continuity supporting docs per import unit  

### Output (must use existing product behaviour)
- Welder registry  
- QR & ID generation  
- Master list (sequence + ranges)  
- Expiry alerts  
- Dashboards  

### Explicitly not required
- **Do not generate** WPQ certificate PDF for these legacy imports (`is_legacy=true`; skip certificate generation pipeline)

## Phased delivery

### Phase 1 — Excel import (this approval)
- Replace public template download with client 18-column sheet + 1–2 example rows (Sanjay dual, Rajesh FW)
- Parse / validate / commit mapping Option A including `process_2` + supplementary fillet
- Continuity multi-date column
- Keep simplified import UI; header aliases for exact client names
- Unit tests from sample rows + multi-process verify alignment
- No certificate PDF generation on commit

### Phase 2 — Document upload (separate approval)
- Certificate PDF + max 10 continuity docs  
- Storage paths + UI after Excel check  

### Phase 3 — Acceptance check
- Spot-check registry, ID/QR, master list ranges, alerts, dashboard for imported sample

## Out of scope (Phase 1)
- Changing qualify wizard UX  
- Operator import  
- Inventing revalidation history from the continuity column (continuity dates only, unless client later adds a revalidation column)

## Success criteria
- Client can fill **only** their template and import without our old column names  
- Sanjay-style row creates **one** WPQ with dual process + BW/FW display like qualify  
- Rajesh-style row creates one FW WPQ  
- Blank cells never inherit previous row  
- No certificate PDF generated for import  
- Existing alerts / master list / dashboards pick up imported rows  

## Open items deferred to Phase 2
- Exact UX for attaching 1 PDF + ≤10 docs (per welder vs per qualification)
