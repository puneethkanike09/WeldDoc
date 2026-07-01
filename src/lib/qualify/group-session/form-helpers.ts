/** FormData ↔ JSON helpers for group session snapshots. */

export function formStr(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export function formNum(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formDataToSnapshot(formData: FormData): Record<string, unknown> {
  const snap: Record<string, unknown> = {};
  const arrays = new Map<string, string[]>();

  for (const [k, v] of formData.entries()) {
    if (v instanceof File) continue;
    if (typeof v !== "string") continue;
    if (k.endsWith("[]")) {
      const base = k.slice(0, -2);
      const arr = arrays.get(base) ?? [];
      arr.push(v);
      arrays.set(base, arr);
    } else {
      snap[k] = v;
    }
  }

  for (const [k, arr] of arrays) snap[k] = arr;

  const methods = formData.getAll("selected_method").map(String).filter(Boolean);
  if (methods.length) snap.selected_methods = methods;

  return snap;
}

export function snapshotStr(
  snap: Record<string, unknown>,
  key: string,
): string | null {
  const v = snap[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

export function snapshotNum(
  snap: Record<string, unknown>,
  key: string,
): number | null {
  const v = snap[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function snapshotBool(
  snap: Record<string, unknown>,
  key: string,
): boolean {
  const v = snap[key];
  return v === "on" || v === "true" || v === true;
}
