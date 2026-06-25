/**
 * Verifies ISO 9606-1 Tables 2–5 filler group/type qualification ranges.
 * Run: node scripts/verify-filler-ranges.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import rules from "../src/lib/range-engine/iso9606.rules.json" with { type: "json" };

const require = createRequire(import.meta.url);
const { fillerTypeQualificationRange } = require("../src/lib/iso9606/filler-types.ts");
const {
  computeRange,
  isNoFillerQualificationTest,
  STEEL_PARENT_MATERIAL_GROUPS,
} = require("../src/lib/range-engine/iso9606.ts");

function test(name, fn) {
  try {
    fn();
    console.log(`  OK ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

console.log("ISO 9606-1 filler & parent material ranges\n");

/** Table 3 — filler material groups FM1–FM6 */
const table3 = {
  FM1: ["FM1", "FM2"],
  FM2: ["FM1", "FM2"],
  FM3: ["FM1", "FM2", "FM3"],
  FM4: ["FM1", "FM2", "FM3", "FM4"],
  FM5: ["FM5"],
  FM6: ["FM5", "FM6"],
};

for (const [testFm, wantGroups] of Object.entries(table3)) {
  test(`Table 3: ${testFm} → ${wantGroups.join(", ")}`, () => {
    const got = rules.fillerGroupRanges[testFm];
    assert.equal(got, wantGroups.join(", "));
  });
}

/** Table 4 — process 111 covered electrodes */
test("Table 4: rutile R qualifies A-group only", () => {
  const r = fillerTypeQualificationRange("R — rutile", "111");
  assert.match(r, /^A,/);
  assert.doesNotMatch(r, /\bB\b/);
  assert.doesNotMatch(r, /\bC\b/);
});

test("Table 4: basic B qualifies A-group and B", () => {
  const r = fillerTypeQualificationRange("B — basic", "111");
  assert.match(r, /\bA\b/);
  assert.match(r, /\bB\b/);
});

test("Table 4: cellulosic C qualifies C only", () => {
  const r = fillerTypeQualificationRange("C — cellulosic", "111");
  assert.match(r, /\bC\b/);
  assert.doesNotMatch(r, /\bA\b/);
});

/** Table 5 — other processes */
test("Table 5: solid S qualifies S, M, nm", () => {
  const r = fillerTypeQualificationRange("Solid wire/rod (S)", "135");
  assert.match(r, /\bS\b/);
  assert.match(r, /\bM\b/);
  assert.match(r, /\bnm\b/);
});

test("Table 5: flux B qualifies all flux types", () => {
  const r = fillerTypeQualificationRange("Flux-cored (B)", "136");
  for (const code of ["B", "R", "P", "V", "W", "Y", "Z"]) {
    assert.match(r, new RegExp(`\\b${code}\\b`));
  }
});

test("Table 5: flux R qualifies R-group only", () => {
  const r = fillerTypeQualificationRange("Flux-cored (R)", "136");
  assert.match(r, /\bR\b/);
  assert.doesNotMatch(r, /\bB\b/);
});

/** §5.5.2 / §5.6 — parent material groups 1–11 with filler */
test("Parent material: with filler → groups 1–11", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
    materialGroup: "1.2",
    fillerGroup: "FM1",
    fillerType: "Solid wire/rod (S)",
    process: "135",
  });
  assert.deepEqual(r.approvedMaterialGroups, [...STEEL_PARENT_MATERIAL_GROUPS]);
});

test("Parent material: process 142 → test group only", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
    materialGroup: "8.1",
    process: "142",
    fillerType: "No filler (nm)",
  });
  assert.deepEqual(r.approvedMaterialGroups, ["8"]);
});

test("Parent material: 311 without filler → test group only", () => {
  assert.equal(isNoFillerQualificationTest("311", "No filler (nm)"), true);
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 5,
    materialGroup: "3.1",
    process: "311",
    fillerType: "No filler (nm)",
  });
  assert.deepEqual(r.approvedMaterialGroups, ["3"]);
});

console.log("\nAll filler & parent material checks passed.");
