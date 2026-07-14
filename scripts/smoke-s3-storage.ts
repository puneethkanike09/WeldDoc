/**
 * Smoke-test S3 app storage (upload → resolve → download → delete).
 * Usage: npx tsx scripts/smoke-s3-storage.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  downloadObject,
  removeObjects,
  resolveUrl,
  uploadBytes,
  uploadFile,
} from "../src/lib/storage";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFiles(...names: string[]) {
  for (const name of names) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const key = t.slice(0, i).trim();
      const value = t.slice(i + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFiles(".env", ".env.local");
  process.env.STORAGE_DRIVER = "s3";

  const folder = `smoke-test/${Date.now()}`;
  const textPath = `${folder}/hello.txt`;
  const body = Buffer.from("welddoc s3 smoke ok\n", "utf8");

  console.log("Uploading bytes to welder-photos/…");
  await uploadBytes("welder-photos", textPath, body, "text/plain");

  console.log("Resolving URL…");
  const url = await resolveUrl("welder-photos", textPath);
  if (!url) throw new Error("resolveUrl returned null");
  console.log("URL prefix:", url.slice(0, 80) + "…");

  console.log("Downloading…");
  const downloaded = await downloadObject("welder-photos", textPath);
  if (downloaded.body.toString("utf8") !== body.toString("utf8")) {
    throw new Error("Downloaded body mismatch");
  }

  console.log("Uploading File via uploadFile…");
  const file = new File([body], "via-file.txt", { type: "text/plain" });
  const filePath = await uploadFile("welder-photos", file, folder);
  if (!filePath) throw new Error("uploadFile returned null");

  console.log("Cleaning up…");
  await removeObjects("welder-photos", [textPath, filePath]);

  console.log("\nOK — S3 storage smoke passed for bucket", process.env.S3_BUCKET);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
