/**
 * Apply a single SQL migration file (safe for already-initialized databases).
 *
 * Usage:
 *   node scripts/apply-migration.mjs 0005_qualification_excel_fields.sql
 */
import pg from "pg";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <migration-file.sql>");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const connectionString = env.SUPABASE_DB_URL;
if (!connectionString || connectionString.includes("YOUR-PASSWORD")) {
  console.error(
    "❌ Set SUPABASE_DB_URL in .env.local (Session pooler URI with your real password).",
  );
  console.error(
    "   Supabase → Connect → Session pooler → URI → copy full string.",
  );
  process.exit(1);
}

const sqlPath = join(root, "supabase", "migrations", file);
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log(`✓ Connected\nRunning ${file} ...`);
  await client.query(sql);
  console.log("✅ Migration applied.");

  if (file === "0009_drop_signatories.sql") {
    console.log("\nRemoving signature/stamp storage buckets ...");
    const result = spawnSync(process.execPath, ["scripts/drop-signatory-storage.mjs"], {
      cwd: root,
      stdio: "inherit",
    });
    if (result.status !== 0) process.exitCode = 1;
  }
} catch (err) {
  console.error("❌ Failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
