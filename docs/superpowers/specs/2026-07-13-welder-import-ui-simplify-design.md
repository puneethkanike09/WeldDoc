# Welder import UI simplify

**Date:** 2026-07-13  
**Status:** Approved  
**Scope:** UI only — same validate, commit, Excel + photos, ZIP, and photo-matching behaviour

## Goal

Make the bulk welder import page easy for non-technical plant users. Keep all current functionality; cut visual and verbal noise.

## Non-goals

- No changes to import validation rules, commit logic, or Excel column schema
- No in-grid editing of Excel data
- No removal of ZIP or photo support (only hide them behind quieter UI)

## Current problems

The import page shows too much at once:

- Long technical instructions (column names, legacy date rules)
- Mode toggle (Excel + photos vs ZIP)
- Separate Step 1 / Step 2 upload blocks
- After validate: 5 summary tiles, warnings table, full data grid, photo-matching table, errors table, then Confirm

## Approach

**Single-screen, stripped down** with plain-language labels. Validate → confirm remains a two-step safety path.

### Upload card

1. One or two short help sentences (no column lectures).
2. **Download blank spreadsheet** (same template endpoint).
3. Primary control: choose / drop Excel (`.xlsx`).
4. Optional: **Add welder photos (optional)** — secondary drop zone or expand control.
5. Quiet link: **Have photos in a ZIP folder?** — switches to ZIP file picker (no mode pills).
6. Primary button: **Check my spreadsheet** → existing `/api/welders/bulk-import/validate`.

Help copy (target):

> Fill the blank spreadsheet (one row per certificate). Then upload it here. Photos are optional — name them like the welder number (W#02.jpg).

### Preview / confirm card

Shown after a successful check (or when there are problems):

| Element | Behaviour |
|---------|-----------|
| Summary | One plain sentence, e.g. “Ready to import: 3 new welders, 3 certificates.” or “1 problem to fix in the spreadsheet.” |
| Problems | Short list (row + message). Blocks **Import these welders**. Label: **Problems to fix in the spreadsheet** |
| Notes | Collapsible short list. Does not block. Label: **Notes (import still works)** |
| Photos | Only if photos or ZIP were uploaded. One line: “2 photos found · 1 missing”. Expand for detail. Missing = OK (add later) |
| Data | Hidden by default. Control: **See what will be imported** → existing read-only preview grid |
| Actions | **Cancel** \| **Import these welders** (enabled only when validation `ok`) |

### Plain-language map

| Current | Simplified |
|---------|------------|
| Validate file | Check my spreadsheet |
| Confirm import | Import these welders |
| Download template | Download blank spreadsheet |
| Excel + photos / ZIP package toggles | Excel primary; ZIP as quiet link |
| Errors | Problems to fix in the spreadsheet |
| Warnings | Notes (import still works) |
| Show data / Data preview | See what will be imported |
| Photo Ready / Missing | Photo found / No photo (OK — you can add later) |

## Behaviour preserved

- Template download unchanged
- Validate multipart/ZIP API unchanged
- Commit server action unchanged
- Whole batch blocked on Excel errors; missing photos warn only
- Fill-forward, legacy dates, continuity/revalidation history — unchanged (backend)

## Implementation notes

- Refactor `src/components/welders/bulk-import-panel.tsx` primarily
- Reuse `ImportPreviewTable` behind the “See what will be imported” disclosure
- Prefer existing Card / Button / Badge patterns; avoid new design system surface
- Keep ZIP and photo FormData paths identical so APIs need no change

## Success criteria

- Non-tech user can: download blank sheet → upload → check → import without reading column docs on the page
- Happy path shows one summary line and Confirm; details optional
- All existing import capabilities still reachable (photos, ZIP, error list, full preview)
