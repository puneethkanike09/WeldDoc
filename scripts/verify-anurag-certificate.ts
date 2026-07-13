import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildDesignation, buildCertRows } from "../src/lib/iso9606/certificate-model";
import { effectiveRangeForWpq } from "../src/lib/iso9606/effective-range";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const wpqId = "bc6c4acb-9929-4f6f-8081-ef12f63e56dc";
  const { data: wpq } = await sb
    .from("qualification_records")
    .select("*")
    .eq("id", wpqId)
    .single();
  const { data: range } = await sb
    .from("ranges_of_approval")
    .select("*")
    .eq("wpq_id", wpqId)
    .maybeSingle();

  if (!wpq) throw new Error("WPQ not found");

  const effective = effectiveRangeForWpq(wpq, range);

  console.log("=== DESIGNATIONS ===");
  buildDesignation(wpq, effective).forEach((l, i) =>
    console.log(`${i + 1}. ${l}`),
  );

  console.log("\n=== KEY CERT ROWS ===");
  for (const row of buildCertRows(wpq, effective)) {
    if (
      [
        "Deposited thickness (mm)",
        "Multi-layer / single layer",
        "Material thickness (mm)",
      ].includes(row.label)
    ) {
      console.log(`${row.label}:`);
      console.log(`  test:  ${row.test}`);
      console.log(`  range: ${row.range}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
