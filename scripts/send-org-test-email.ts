/**
 * Send a one-off welcome/test email to the organisation's alert recipients.
 *
 * Usage: npx tsx scripts/send-org-test-email.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sendOrgWelcomeEmail } from "../src/lib/email";
import type { Organization } from "../src/types/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");

  const targetName = process.argv[2]?.trim();

  const supabase = createClient(url, key);

  let query = supabase.from("organizations").select("*");
  if (targetName) {
    query = query.ilike("name", `%${targetName}%`);
  } else {
    query = query.limit(1);
  }

  const { data: orgs, error } = await query;

  if (error) throw new Error(error.message);

  const org = (orgs as Organization[] | null)?.[0];

  if (!org) {
    throw new Error(
      targetName
        ? `No organisation matching "${targetName}".`
        : "No organisation found.",
    );
  }

  const recipients = org.alert_emails?.filter(Boolean) ?? [];
  if (recipients.length === 0) {
    throw new Error(
      `No alert recipients configured for "${org.name}". Add emails in Settings → Organisation & alerts.`,
    );
  }

  console.log(`Sending test email for "${org.name}" to: ${recipients.join(", ")}`);
  console.log(`From: ${process.env.RESEND_FROM_EMAIL}\n`);

  const result = await sendOrgWelcomeEmail(recipients, org.name);

  if (!result.sent) {
    console.error("Failed:", result.error);
    process.exit(1);
  }

  console.log("Sent successfully.", result.id ? `id: ${result.id}` : "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
