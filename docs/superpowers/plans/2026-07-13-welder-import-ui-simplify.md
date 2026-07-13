# Welder Import UI Simplify — Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes track progress.

**Goal:** Simplify the welder bulk-import page UI for non-tech users while keeping the same validate/commit/photos/ZIP behaviour.

**Architecture:** Refactor `bulk-import-panel.tsx` only — plain-language copy, quieter upload controls, compact preview with disclosures. No API changes.

**Tech Stack:** Next.js client component, existing Card/Button/Badge, ImportPreviewTable

---

### Task 1: Rewrite BulkImportPanel UI

**Files:**
- Modify: `src/components/welders/bulk-import-panel.tsx`
- Modify (optional label): `src/components/welders/import-preview-table.tsx`
- Modify (page title if needed): `src/app/(app)/welders/import/page.tsx`

- [x] Replace long help with short copy
- [x] Excel primary + optional photos + ZIP quiet link
- [x] Compact preview: summary sentence, problems, collapsible notes/photos/data
- [x] Plain-language buttons and toasts
- [x] Verify TypeScript / lint clean
