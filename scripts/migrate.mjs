import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env.local manually.
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
    "❌ Set SUPABASE_DB_URL in .env.local to your Supabase connection string (with the real password).",
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
  await client.connect();
  console.log("✓ Connected to Supabase Postgres\n");

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`Running ${file} ... `);
    await client.query(sql);
    console.log("done");
  }

  console.log("\n✅ All migrations applied successfully.");
} catch (err) {
  console.error("\n❌ Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
