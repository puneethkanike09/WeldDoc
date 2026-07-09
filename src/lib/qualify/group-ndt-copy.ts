export type NdtCopySnapshot = Record<
  string,
  { testDate: string; ref: string }
>;

function formFieldValue(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  if (el instanceof RadioNodeList) {
    for (const node of el) {
      if (node instanceof HTMLInputElement && node.checked) {
        return node.value;
      }
    }
  }
  return "";
}

export function memberNdtScope(memberId: string): string {
  return `member_${memberId}_`;
}

export function snapshotNdtDateAndRef(
  form: HTMLFormElement,
  sourceScope: string,
  methods: string[],
): NdtCopySnapshot {
  const snapshot: NdtCopySnapshot = {};
  for (const method of methods) {
    snapshot[method] = {
      testDate: formFieldValue(form, `${sourceScope}test_date__${method}`),
      ref: formFieldValue(form, `${sourceScope}conducted_by__${method}`),
    };
  }
  return snapshot;
}

export function ndtCopyFieldKeys(
  targetScope: string,
  methods: string[],
): string[] {
  const keys: string[] = [];
  for (const method of methods) {
    keys.push(`${targetScope}test_date__${method}`);
    keys.push(`${targetScope}conducted_by__${method}`);
  }
  return keys;
}
