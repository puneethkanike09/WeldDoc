import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { computeRange } = require("../src/lib/range-engine/iso9606.ts");

function test(name, fn) {
  try {
    fn();
    console.log(`  OK ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

console.log("ISO 9606-1 range engine (Tables 6, 7, 8)\n");

test("Table 6: deposited 5 mm → 3–10 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 5,
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, 10);
});

test("Table 6: deposited 2 mm → 2–4 mm (s to max(3, 2s))", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 2,
  });
  assert.equal(r.thicknessMin, 2);
  assert.equal(r.thicknessMax, 4);
});

test("Table 6: deposited 1 mm → 1–3 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 1,
  });
  assert.equal(r.thicknessMin, 1);
  assert.equal(r.thicknessMax, 3);
});

test("Table 6: process 311, deposited 5 mm → 3–7.5 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 5,
    process: "311",
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, 7.5);
});

test("Table 6: s ≥ 12 mm without multi-layer → 3–24 mm (not unlimited)", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
    layer: "Single layer (sl)",
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, 24);
  assert.equal(r.thicknessUnlimited, false);
});

test("Table 6: deposited 12 mm → ≥ 3 mm unlimited", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, null);
  assert.equal(r.thicknessUnlimited, true);
});

test("Table 8: fillet t = 12 mm → ≥ 3 mm", () => {
  const r = computeRange({
    jointType: "FW",
    product: "Plate",
    testThicknessMm: 12,
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, null);
  assert.equal(r.thicknessUnlimited, true);
});

test("Table 8: fillet t = 2 mm → 2–4 mm", () => {
  const r = computeRange({
    jointType: "FW",
    product: "Plate",
    testThicknessMm: 2,
  });
  assert.equal(r.thicknessMin, 2);
  assert.equal(r.thicknessMax, 4);
  assert.equal(r.thicknessUnlimited, false);
});

test("Table 8: fillet t = 1 mm → 1–3 mm", () => {
  const r = computeRange({
    jointType: "FW",
    product: "Plate",
    testThicknessMm: 1,
  });
  assert.equal(r.thicknessMin, 1);
  assert.equal(r.thicknessMax, 3);
});

test("Table 7: pipe D = 20 mm → 20–40 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
    pipeOdMm: 20,
  });
  assert.equal(r.pipeOdMin, 20);
  assert.equal(r.pipeOdMax, 40);
  assert.equal(r.pipeOdUnlimited, false);
});

test("Table 7: pipe D = 25 mm → 25–50 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
    pipeOdMm: 25,
  });
  assert.equal(r.pipeOdMin, 25);
  assert.equal(r.pipeOdMax, 50);
});

test("Table 7: pipe D = 150 mm → ≥ 75 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
    pipeOdMm: 150,
  });
  assert.equal(r.pipeOdMin, 75);
  assert.equal(r.pipeOdMax, null);
  assert.equal(r.pipeOdUnlimited, true);
});

test("Table 7: pipe D = 26 mm → ≥ 25 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 12,
    layer: "Multi-layer (ml)",
    pipeOdMm: 26,
  });
  assert.equal(r.pipeOdMin, 25);
  assert.equal(r.pipeOdMax, null);
  assert.equal(r.pipeOdUnlimited, true);
});

test("BW without supplementary → BW only", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
    supplementaryFillet: false,
  });
  assert.deepEqual(r.approvedJointTypes, ["BW"]);
});

test("BW with supplementary fillet → BW + FW", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
    supplementaryFillet: true,
  });
  assert.deepEqual(r.approvedJointTypes, ["BW", "FW"]);
});

test("Plate test → pipe OD ≥ 500 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
  });
  assert.equal(r.pipeOdMin, 500);
});

test("Table 1 multi-process: union of s1=8 (111) and s2=3 (141)", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 8,
    process: "111",
    layer: "Multi-layer (ml)",
    secondProcess: {
      process: "141",
      depositedThicknessMm: 3,
      layer: "Multi-layer (ml)",
    },
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, 16);
  assert.equal(r.thicknessUnlimited, false);
});

console.log("\nAll ISO range checks passed.");
