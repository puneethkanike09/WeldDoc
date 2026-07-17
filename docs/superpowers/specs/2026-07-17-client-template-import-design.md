# Client Excel Template Import (Option A)

**Date:** 2026-07-17  
**Status:** Draft — awaiting user approval before implementation  
**Source file:** `welddoc-welder-import-template_2.xlsx` (client-provided)

## Goal

Accept the **exact client Import sheet** (18 columns) for legacy welder bulk import, store dual-process / BW+FW rows the **same way the qualify wizard already does**, run **commit in the background** (Redis queue) so large imports are reliable, and meet the client’s stated inputs/outputs — without inventing blank cell values.

## Decision locked

**Option A — one Excel row → one `qualification_records` row**

- Multi-process: `process` + `process_2` (e.g. `136+135` → `136` / `135`)
- BW+FW: `joint_type = 'BW'` + supplementary fillet fields (never store `joint_type = 'BW/FW'`; display derives `BW/FW`)
- Single-process FW-only (e.g. Rajesh `141` + `FW`): normal single-process row, `process_2` null, no supplementary fillet required

This matches existing schema (`0021_multi_process`, supplementary fillet columns), qualify UI, master list, certificates, and `scripts/verify-multi-process.ts`.

**Background processing — Redis + BullMQ + worker**

Legacy import is critical and can be large (Excel + photos + later docs). Commit must **not** run inside a single Next.js HTTP request.

| Piece | Choice | Why |
|-------|--------|-----|
| Broker | **Redis** | Fits existing Docker; simple, proven |
| Queue lib | **BullMQ** | Standard Node/TS jobs, retries, progress |
| Runner | **`worker` container** (same image, different command) | Import survives if web request times out; can scale separately |
| Validate | **Synchronous** in API | User still sees errors before anything is written |
| Commit | **Async job** | Writes welders / WPQs / photos / validations in background |

### Job flow (Phase 1)

```
Upload Excel (+ optional photos)
        │
        ▼
  Validate (sync) ──errors──► Show problems (nothing queued)
        │
        ok
        ▼
  Store payload (validated rows + photo refs) + create import_jobs row
        │
        ▼
  Enqueue BullMQ job ──► Redis
        │
        ▼
  Worker: commitValidatedImport (Option A mapping)
        │
        ▼
  Update import_jobs: queued → running → succeeded | failed
        │
        ▼
  UI polls job status → “Import complete” / error detail
```

### Docker (`docker-compose.yml` additions)

Current compose has `app` + `nginx` only. Add:

```yaml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  # internal only; app + worker connect via redis://redis:6379

worker:
  build: same as app
  command: # npm run worker:import (BullMQ consumer)
  env_file: .env.production
  depends_on: [redis]
  restart: unless-stopped
```

`app` also gets `REDIS_URL=redis://redis:6379` to enqueue jobs.

### Persistence

Table **`import_jobs`** (org-scoped):

- `id`, `org_id`, `created_by`, `status` (`queued` \| `running` \| `succeeded` \| `failed`)
- `summary` (counts), `error_message`, `progress` (optional 0–100)
- `payload_path` or storage keys for validated rows / photos
- timestamps

Worker updates this table; UI reads it via status API (poll). Prefer **one active heavy import per org** (queue others).

### Reliability

- Job **retries** limited (e.g. 2) with backoff; failed jobs keep error text  
- Commit stays careful / rollback-friendly as today where possible  
- Max rows still **1000** per file  
- Photos uploaded to storage **before** enqueue so the worker does not need the browser session  

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

**DB defaults when Excel omits fields the DB still needs** (not shown to client): e.g. material group / product / testing standard — use safe defaults; never copy from previous Excel row.

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
| `BW/FW` | `joint_type=BW` + supplementary fillet true; BW cols → BW fields; FW cols → `supplementary_fillet_*` (and `_2` when `process_2` set) |
| `NA` | Treat as empty for that side |

### Continuity
- Split `continuity_last_verified` cell on `;` / `,`
- All valid dates → `validation_records` (`kind=continuity`)
- Snapshot on WPQ = **latest** parsed date
- Blank cell → null / no records (no invent)

### Dates / blanks / photos
- Expiry as-is; no fill-forward; repeat W# + name every row; photos optional by filename / W#.jpg

## Client requirements (from Excel notes)

**Input:** Excel template; later Phase 2 docs (1 cert PDF + ≤10 continuity files).  

**Output:** Registry, QR/ID, master list ranges, expiry alerts, dashboards.  

**Not required:** Generate WPQ certificate PDF for legacy import.

## Phased delivery

### Phase 1 — Excel import + background commit
- Redis + BullMQ + `worker` in Docker Compose  
- `import_jobs` + status poll on import UI  
- Client 18-column template + Option A mapping  
- Sync validate → enqueue commit  
- Unit tests + worker smoke path  

### Phase 2 — Document upload
- Certificate PDF + max 10 continuity docs (same worker queue)  

### Phase 3 — Acceptance
- End-to-end sample + large-file job status check  

## Out of scope (Phase 1)
- Qualify wizard changes, operator import, full admin job console  

## Success criteria
- Client template only; Option A storage; blank stays blank  
- Commit in **background worker**; UI shows queued → running → done/fail  
- Redis + worker via Docker Compose  
- No cert PDF on import; existing product surfaces pick up data  

## Open items (Phase 2)
- Exact UX for 1 PDF + ≤10 docs (per welder vs per qualification)
