import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env.local manually (no dotenv dependency).
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

console.log("URL:", env.NEXT_PUBLIC_SUPABASE_URL);

// 1. Auth users
const { data: users, error: uErr } = await admin.auth.admin.listUsers();
if (uErr) console.log("auth.listUsers ERROR:", uErr.message);
else
  console.log(
    `\nAuth users (${users.users.length}):`,
    users.users.map((u) => `${u.email} (${u.id})`),
  );

// 2. Tables exist? Probe each.
for (const t of ["organizations", "profiles", "welders"]) {
  const { count, error } = await admin
    .from(t)
    .select("*", { count: "exact", head: true });
  console.log(
    `table ${t}:`,
    error ? `ERROR ${error.message}` : `${count} rows`,
  );
}

// 3. Profiles content
const { data: profiles, error: pErr } = await admin
  .from("profiles")
  .select("*");
console.log(
  "\nProfiles:",
  pErr ? `ERROR ${pErr.message}` : profiles,
);

// 4. For each auth user, is there a matching profile?
if (users?.users?.length) {
  for (const u of users.users) {
    const match = (profiles ?? []).find((p) => p.id === u.id);
    console.log(`  ${u.email}: profile ${match ? "FOUND" : "MISSING"}`);
  }
}
