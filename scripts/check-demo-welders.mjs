import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: orgs } = await sb.from("organizations").select("id, name");
const { data: welders } = await sb
  .from("welders")
  .select("org_id, welder_id, full_name, uid, created_at")
  .order("created_at", { ascending: false });

const { data: profiles } = await sb
  .from("profiles")
  .select("id, email, org_id, full_name");

console.log("=== ORGANISATIONS ===");
for (const o of orgs ?? []) console.log(`  ${o.name} (${o.id})`);

console.log("\n=== USER PROFILES → ORG ===");
for (const p of profiles ?? []) {
  const org = orgs?.find((o) => o.id === p.org_id);
  console.log(`  ${p.email ?? p.full_name} → ${org?.name ?? "?"}`);
}

console.log("\n=== ALL WELDERS BY ORG ===");
for (const o of orgs ?? []) {
  const list = (welders ?? []).filter((w) => w.org_id === o.id);
  console.log(`\n${o.name} (${list.length} welders):`);
  for (const w of list) {
    console.log(`  ${w.welder_id ?? "—"} | ${w.full_name}`);
  }
}

console.log("\n=== DEMO W#9901–9903 ===");
for (const id of ["W#9901", "W#9902", "W#9903"]) {
  const w = welders?.find((x) => x.welder_id === id);
  if (w) {
    const org = orgs?.find((o) => o.id === w.org_id);
    console.log(`  ${id} FOUND in org "${org?.name}"`);
  } else {
    console.log(`  ${id} NOT FOUND`);
  }
}
