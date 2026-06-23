/**
 * Empty and delete signature/stamp storage buckets via the Supabase Storage API.
 * Run after 0009_drop_signatories.sql (SQL cannot delete storage rows directly).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listAllPaths(bucket, prefix = "") {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error) throw error;

  const paths = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id == null) {
      paths.push(...(await listAllPaths(bucket, path)));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

async function removeBucket(bucket) {
  let paths = [];
  try {
    paths = await listAllPaths(bucket);
  } catch (listError) {
    if (listError.message?.toLowerCase().includes("not found")) {
      console.log(`· ${bucket}: already removed`);
      return;
    }
    throw new Error(`${bucket} list failed: ${listError.message}`);
  }

  if (paths.length) {
    const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
    if (removeError) {
      throw new Error(`${bucket} remove failed: ${removeError.message}`);
    }
    console.log(`· ${bucket}: deleted ${paths.length} object(s)`);
  } else {
    console.log(`· ${bucket}: no objects`);
  }

  const { error: deleteError } = await supabase.storage.deleteBucket(bucket);
  if (deleteError) {
    if (deleteError.message.toLowerCase().includes("not found")) {
      console.log(`· ${bucket}: bucket already removed`);
      return;
    }
    throw new Error(`${bucket} delete failed: ${deleteError.message}`);
  }

  console.log(`· ${bucket}: bucket removed`);
}

for (const bucket of ["signatures", "stamps"]) {
  await removeBucket(bucket);
}

console.log("✅ Signature/stamp storage buckets removed.");
