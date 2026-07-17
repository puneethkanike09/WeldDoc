# Client Template Import + Background Queue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import welders from the client’s exact 18-column Excel (Option A dual-process mapping) with sync validate and async BullMQ commit via Redis worker.

**Architecture:** Extend `src/lib/welders/bulk-import/*` for client headers + Option A storage. Validate stays in Next API. Commit is enqueued to Redis (BullMQ); a Docker `worker` process runs `commitValidatedImport` and updates `import_jobs`. UI polls job status.

**Tech Stack:** Next.js, Supabase, BullMQ, Redis 7, Docker Compose, xlsx

## Global Constraints

- Option A: one Excel row → one WPQ (`process`/`process_2` + supplementary fillet for BW/FW)
- No fill-forward; blank stays blank
- Client headers exact; expiry as-is; multi-date continuity in one column
- No certificate PDF generation on legacy import
- Max 1000 rows; org-scoped

---

### Task 1: Client columns, parse aliases, Option A validate mapping

**Files:**
- Modify: `src/lib/welders/bulk-import/columns.ts`, `types.ts`, `parse.ts`, `normalize.ts`, `validate.ts`, `template.ts`, `field-config.ts`, `display.ts`
- Create: `src/lib/welders/bulk-import/map-client-row.ts` (process split, BW/FW → storage shape)
- Test: `scripts/verify-bulk-import.ts`

- [ ] Replace TEMPLATE_COLUMNS / IMPORT_COLUMNS with client 18 headers (keep internal aliases)
- [ ] Parse `136+135`, `BW/FW`, `NA`, multi-date continuity
- [ ] Build template from client sample (Sanjay + Rajesh)
- [ ] Tests green for sample rows

### Task 2: Commit writes process_2 + supplementary fillet

**Files:**
- Modify: `src/lib/welders/bulk-import/commit.ts`, `types.ts`
- Test: extend verify + optional multi-process assert

- [ ] Insert WPQ with dual-process / fillet fields; `is_legacy=true`; no cert PDF
- [ ] Continuity: insert all validation_records from multi-date cell

### Task 3: `import_jobs` migration + queue infrastructure

**Files:**
- Create: `supabase/migrations/00XX_import_jobs.sql`
- Create: `src/lib/queue/redis.ts`, `src/lib/queue/welder-import-queue.ts`
- Create: `scripts/worker-welder-import.ts`
- Modify: `package.json` (bullmq, ioredis, `worker:import` script)
- Modify: `docker-compose.yml`, `Dockerfile` (worker stage), `.env.example`

- [ ] Migration for import_jobs
- [ ] Enqueue + worker consumer calling commit
- [ ] Redis + worker services in compose

### Task 4: API + UI job flow

**Files:**
- Modify: validate/commit routes or actions to enqueue after ok validate
- Create: `src/app/api/welders/bulk-import/jobs/[id]/route.ts` (status)
- Modify: `bulk-import-panel.tsx` — Import enqueues; poll status

- [ ] Sync validate unchanged UX
- [ ] Confirm → create job + enqueue; show progress/result

### Task 5: Verification

- [ ] `npm run verify:import`
- [ ] `npm run build`
- [ ] Spec status → Implemented
