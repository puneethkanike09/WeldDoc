import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { computeRange } = require("../src/lib/range-engine/iso9606.ts");

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("Range engine (ISO 9606-1 Tables 6, 7, 8)\n");

test("Table 6: deposited 12 mm → ≥ 3 mm unlimited", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 12,
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, null);
  assert.equal(r.thicknessUnlimited, true);
});

test("Table 6: deposited 5 mm → 3–10 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Plate",
    depositedThicknessMm: 5,
  });
  assert.equal(r.thicknessMin, 3);
  assert.equal(r.thicknessMax, 10);
  assert.equal(r.thicknessUnlimited, false);
});

test("Table 7: pipe D=150 mm → ≥ 75 mm", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 12,
    pipeOdMm: 150,
  });
  assert.equal(r.pipeOdMin, 75);
  assert.equal(r.pipeOdUnlimited, true);
});

test("Table 7: pipe D=26 mm → ≥ 25 mm (floor, not 13)", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Pipe",
    depositedThicknessMm: 12,
    pipeOdMm: 26,
  });
  assert.equal(r.pipeOdMin, 25);
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

test("Other + Overlay → no thickness range", () => {
  const r = computeRange({
    jointType: "BW",
    product: "Other",
    depositedThicknessMm: 12,
    jointTypeExtended: "Overlay",
  });
  assert.equal(r.thicknessMin, null);
  assert.equal(r.pipeOdMin, null);
});

console.log("\nAll range engine checks passed.");
