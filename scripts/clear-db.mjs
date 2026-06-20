/**
 * Wipe operational WeldDoc data (welders, qualifications, reports, etc.)
 * Keeps organizations, profiles, and auth users so you can still sign in.
 *
 * Usage: node scripts/clear-db.mjs
 * Requires SUPABASE_DB_URL in .env.local (Session pooler URI, password URL-encoded).
 */
import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
    "❌ Set SUPABASE_DB_URL in .env.local (Session pooler URI with URL-encoded password).",
  );
  process.exit(1);
}

const CLEAR_SQL = `
TRUNCATE TABLE
  notification_log,
  validation_records,
  ndt_dt_records,
  ranges_of_approval,
  qualification_records,
  qualification_test_reports,
  welders,
  signatories
RESTART IDENTITY CASCADE;

UPDATE organizations
SET welder_seq = 0, wpq_seq = 100;
`;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("✓ Connected");
  console.log("Clearing welders, qualifications, reports, signatories…");
  await client.query(CLEAR_SQL);

  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM welders) AS welders,
      (SELECT count(*)::int FROM qualification_records) AS qualifications,
      (SELECT count(*)::int FROM qualification_test_reports) AS reports,
      (SELECT count(*)::int FROM signatories) AS signatories,
      (SELECT count(*)::int FROM profiles) AS profiles,
      (SELECT count(*)::int FROM organizations) AS orgs
  `);
  const c = counts.rows[0];
  console.log("✅ Database cleared.");
  console.log(
    `   welders=${c.welders} qualifications=${c.qualifications} reports=${c.reports} signatories=${c.signatories}`,
  );
  console.log(`   profiles=${c.profiles} orgs=${c.orgs} (login preserved)`);
  console.log(
    "\nNote: Storage files (photos, PDFs) in Supabase buckets are not deleted.",
  );
} catch (err) {
  console.error("❌ Failed:", err.message);
  if (err.message.includes("password authentication")) {
    console.error(
      "   Tip: if your DB password contains @, encode it as %40 in SUPABASE_DB_URL.",
    );
  }
  process.exitCode = 1;
} finally {
  await client.end();
}
