/**
 * Full ISO 9606-1 qualification range verification suite.
 * Run after any change to src/lib/range-engine/ or src/lib/iso9606/filler-types.ts
 *
 * Usage: npm run verify:iso9606
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const scripts = [
  "verify-range-engine.mjs",
  "verify-position-maps.mjs",
  "verify-filler-ranges.mjs",
  { file: "verify-multi-process.ts", runner: "tsx" },
];

let failed = false;
for (const entry of scripts) {
  const script = typeof entry === "string" ? entry : entry.file;
  const useTsx = typeof entry === "object" && entry.runner === "tsx";
  console.log(`\n=== ${script} ===\n`);
  const result = useTsx
    ? spawnSync("npx tsx scripts/" + script, {
        stdio: "inherit",
        cwd: root,
        shell: true,
      })
    : spawnSync(process.execPath, [path.join(root, "scripts", script)], {
        stdio: "inherit",
        cwd: root,
      });
  if (result.status !== 0) failed = true;
}

if (failed) {
  console.error("\nISO 9606-1 verification FAILED.");
  process.exit(1);
}

console.log("\n=== All ISO 9606-1 qualification range tables verified ===\n");
