const PREFIX = "welddoc:qualify:draft:";

export function qualifyDraftKey(
  welderId: string,
  wpqId: string | null,
  step: number,
): string {
  return `${PREFIX}${welderId}:${wpqId ?? "new"}:step${step}`;
}

export function loadQualifyDraft(key: string): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveQualifyDraft(
  key: string,
  data: Record<string, string>,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearQualifyDraft(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

export function formDataToDraft(form: HTMLFormElement): Record<string, string> {
  const draft: Record<string, string> = {};
  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    if (typeof value === "string") draft[key] = value;
    else if (value instanceof File && value.name) draft[key] = value.name;
  }
  for (const el of form.elements) {
    if (
      el instanceof HTMLInputElement &&
      (el.type === "checkbox" || el.type === "radio")
    ) {
      if (el.checked) draft[el.name] = el.value || "on";
    }
  }
  return draft;
}

export function applyDraftToForm(
  form: HTMLFormElement,
  draft: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(draft)) {
    const fields = form.elements.namedItem(name);
    if (!fields) continue;
    const list = (
      "length" in fields && typeof fields.length === "number"
        ? Array.from(fields as unknown as Iterable<Element>)
        : [fields]
    ) as Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    for (const el of list) {
      if (el instanceof HTMLInputElement) {
        if (el.type === "checkbox") el.checked = value === "on" || value === el.value;
        else if (el.type === "radio") el.checked = el.value === value;
        else el.value = value;
      } else if (
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        el.value = value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }
}
