/**
 * EN ISO 9606-1:2017 Table 13 — mandatory tests by welding process and joint type.
 * Note B: RT exempt for 131, 135, 138 → UT required instead (note C).
 */

export const TEST_METHOD = {
  visual: "Visual testing",
  radiographic: "Radiographic testing",
  ultrasonic: "Ultrasonic testing",
  fracture: "Fracture test",
} as const;

export type TestMethod = (typeof TEST_METHOD)[keyof typeof TEST_METHOD];

const RT_EXEMPT_PROCESSES = new Set(["131", "135", "138"]);

/** Mandatory test methods for the qualify wizard (Table 13). */
export function mandatoryTestMethods(
  process: string,
  joint: "BW" | "FW",
): TestMethod[] {
  if (joint === "FW") {
    return [TEST_METHOD.visual, TEST_METHOD.fracture];
  }

  const tests: TestMethod[] = [TEST_METHOD.visual];
  if (RT_EXEMPT_PROCESSES.has(process)) {
    tests.push(TEST_METHOD.ultrasonic);
  } else {
    tests.push(TEST_METHOD.radiographic);
  }
  return tests;
}

/** Legacy DB rows may still use old method labels — map for display/validation. */
export const LEGACY_TEST_METHOD_ALIASES: Record<string, TestMethod> = {
  "Visual (Root)": TEST_METHOD.visual,
  "Visual (Cap)": TEST_METHOD.visual,
  "RT/UT": TEST_METHOD.radiographic,
  "Fracture Test": TEST_METHOD.fracture,
};

export function normalizeTestMethod(method: string): string {
  return LEGACY_TEST_METHOD_ALIASES[method] ?? method;
}
