/** Clear notification_log for an org (test only). Usage: npx tsx scripts/reset-org-notifications.ts Puneeth */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
  }
}

async function main() {
  loadEnv();
  const name = process.argv[2] ?? "Puneeth";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name")
    .ilike("name", `%${name}%`)
    .single();

  if (error || !org) throw new Error(error?.message ?? "Organisation not found");

  const { count } = await supabase
    .from("notification_log")
    .delete({ count: "exact" })
    .eq("org_id", org.id);

  console.log(`Cleared ${count ?? 0} notification_log row(s) for ${org.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
