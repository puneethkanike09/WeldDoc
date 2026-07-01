/**
 * Verify expiry cron logic and optionally invoke the live route handler.
 *
 * Usage:
 *   npx tsx scripts/verify-expiry-cron.ts           # logic tests only
 *   npx tsx scripts/verify-expiry-cron.ts --live    # also call GET /api/cron/expiry-alerts
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  bucketFor,
  daysUntil,
  orgDigestKind,
} from "../src/lib/expiry-alerts/cron-logic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name: string) {
  const path = join(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function runLogicTests() {
  const lead = [30, 7];
  assert(bucketFor(31, lead) === null, "31 days should be outside default lead");
  assert(bucketFor(30, lead) === "d30", "30 days should bucket to d30");
  assert(bucketFor(8, lead) === "d30", "8 days should bucket to d30");
  assert(bucketFor(7, lead) === "d7", "7 days should bucket to d7");
  assert(bucketFor(0, lead) === "d7", "0 days should bucket to d7");
  assert(bucketFor(-1, lead) === "overdue", "overdue should bucket correctly");

  const now = new Date("2026-07-01T12:00:00Z").getTime();
  assert(daysUntil("2026-07-31", now) === 30, "daysUntil should count up");
  assert(daysUntil("2026-06-30", now) === -1, "daysUntil should count overdue");

  assert(orgDigestKind(1, 0) === "welder", "welder-only digest kind");
  assert(orgDigestKind(0, 1) === "operator", "operator-only digest kind");
  assert(orgDigestKind(2, 3) === "mixed", "mixed digest kind");

  console.log("✓ Logic tests passed (bucketFor, daysUntil, orgDigestKind)");
}

async function testAuthGuard() {
  const { NextRequest } = await import("next/server");
  const { GET } = await import("../src/app/api/cron/expiry-alerts/route");
  const savedVercel = process.env.VERCEL;
  const savedSecret = process.env.CRON_SECRET;

  try {
    process.env.VERCEL = "1";
    delete process.env.CRON_SECRET;
    const res = await GET(
      new NextRequest("http://localhost/api/cron/expiry-alerts"),
    );
    assert(res.status === 503, "Vercel without CRON_SECRET should return 503");

    process.env.CRON_SECRET = "test-secret";
    const bad = await GET(
      new NextRequest("http://localhost/api/cron/expiry-alerts", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    assert(bad.status === 401, "Wrong bearer should return 401");

    console.log("✓ Auth guard tests passed");
  } finally {
    if (savedVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = savedVercel;
    if (savedSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = savedSecret;
  }
}

async function runLiveHandler() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("⊘ Skipping live handler — Supabase env vars not set");
    return;
  }

  const { NextRequest } = await import("next/server");
  const { GET } = await import("../src/app/api/cron/expiry-alerts/route");
  const headers: Record<string, string> = {};
  if (process.env.CRON_SECRET) {
    headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
  }

  const res = await GET(
    new NextRequest("http://localhost/api/cron/expiry-alerts", { headers }),
  );
  const body = await res.json();

  assert(res.status === 200, `Live handler should return 200, got ${res.status}`);
  assert(body.ok === true, "Response should include ok: true");
  assert(typeof body.totalSent === "number", "totalSent should be a number");
  assert(
    typeof body.individualEmailsSent === "number",
    "individualEmailsSent should be a number",
  );
  assert(typeof body.summary === "object", "summary should be an object");

  console.log("✓ Live handler response:", JSON.stringify(body, null, 2));
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const live = process.argv.includes("--live");

  console.log("Expiry cron verification\n");
  runLogicTests();
  await testAuthGuard();

  if (live) {
    await runLiveHandler();
  } else {
    console.log("\nTip: run with --live to invoke the handler against your Supabase DB");
  }

  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error("\n✗ Verification failed:", err.message ?? err);
  process.exit(1);
});
