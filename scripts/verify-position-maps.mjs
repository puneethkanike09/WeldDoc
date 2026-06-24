/**
 * Verifies ISO 9606-1 Table 9 (butt) and Table 10 (fillet) position maps
 * against values extracted from BS EN ISO 9606-1:2017 (standards-key-sections.txt).
 *
 * Run: node scripts/verify-position-maps.mjs
 */
import rules from "../src/lib/range-engine/iso9606.rules.json" with { type: "json" };

const { positionMapBw, positionMapFw } = rules;

/** @type {[string, string[]][]} */
const table9 = [
  ["PA", ["PA"]],
  ["PC", ["PA", "PC"]],
  ["PE", ["PA", "PC", "PE"]],
  ["PF", ["PA", "PF"]],
  ["PH", ["PA", "PE", "PF"]],
  ["PG", ["PG"]],
  ["PJ", ["PA", "PE", "PG"]],
  ["H-L045", ["PA", "PC", "PE", "PF"]],
  ["J-L045", ["PA", "PC", "PE", "PG"]],
];

/** @type {[string, string[]][]} */
const table10 = [
  ["PA", ["PA"]],
  ["PB", ["PA", "PB"]],
  ["PC", ["PA", "PB", "PC"]],
  ["PD", ["PA", "PB", "PC", "PD", "PE"]],
  ["PE", ["PA", "PB", "PC", "PD", "PE"]],
  ["PF", ["PA", "PB", "PF"]],
  ["PH", ["PA", "PB", "PC", "PD", "PE", "PF"]],
  ["PG", ["PG"]],
  ["PJ", ["PA", "PB", "PD", "PE", "PG"]],
];

function same(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function check(label, map, expected) {
  let failed = 0;
  for (const [testPos, want] of expected) {
    const got = map[testPos];
    if (!got || !same(got, want)) {
      console.error(`FAIL ${label} ${testPos}: want [${want}] got [${got ?? ""}]`);
      failed++;
    }
  }
  const extra = Object.keys(map).filter(
    (k) => k !== "note" && !expected.some(([p]) => p === k),
  );
  if (extra.length) {
    console.error(`FAIL ${label}: unexpected keys ${extra.join(", ")}`);
    failed++;
  }
  return failed;
}

let failures = 0;
failures += check("Table 9 (BW)", positionMapBw, table9);
failures += check("Table 10 (FW)", positionMapFw, table10);

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("All Table 9 and Table 10 position maps match BS EN ISO 9606-1:2017.");
