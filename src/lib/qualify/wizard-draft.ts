/** Persist wizard form fields in sessionStorage between steps. */

export function qualifyDraftKey(
  welderId: string,
  wpqId: string,
  step: number,
): string {
  return `welddoc:qualify:${welderId}:${wpqId}:step${step}`;
}

export function operatorQualifyDraftKey(
  operatorId: string,
  oqId: string,
  step: number,
): string {
  return `welddoc:qualify:operator:${operatorId}:${oqId}:step${step}`;
}

export function loadQualifyDraft(key: string): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export function saveQualifyDraft(key: string, form: HTMLFormElement): void {
  if (typeof window === "undefined") return;
  const data: Record<string, string> = {};
  const fd = new FormData(form);
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") data[k] = v;
    else if (v instanceof File && v.size > 0) continue;
  }
  for (const el of form.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]',
  )) {
    if (el.name) data[el.name] = el.checked ? "on" : "";
  }
  sessionStorage.setItem(key, JSON.stringify(data));
}

export function clearQualifyDraft(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

/** Restore saved draft values onto a form (native fields only). */
export function applyQualifyDraft(
  form: HTMLFormElement,
  draft: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(draft)) {
    const field = form.elements.namedItem(name);
    if (!field) continue;

    if (field instanceof RadioNodeList) {
      for (let i = 0; i < field.length; i++) {
        const el = field[i];
        if (el instanceof HTMLInputElement) {
          el.checked = el.value === value;
        }
      }
      continue;
    }

    if (field instanceof HTMLInputElement) {
      if (field.type === "checkbox") field.checked = value === "on";
      else if (field.type !== "file") field.value = value;
    } else if (field instanceof HTMLSelectElement) {
      field.value = value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (field instanceof HTMLTextAreaElement) {
      field.value = value;
    }
  }
}
