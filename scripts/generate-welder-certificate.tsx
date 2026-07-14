/**
 * Generate a welder certificate PDF locally (uses service role + current code).
 * Usage:
 *   npx tsx scripts/generate-welder-certificate.tsx
 *   npx tsx scripts/generate-welder-certificate.tsx <welderId> <wpqId> [outputPath]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  CertificateDocument,
  type CertificateData,
} from "../src/lib/pdf/certificate";
import { buildCertNo } from "../src/lib/iso9606/certificate-model";
import { effectiveRangeForWpq } from "../src/lib/iso9606/effective-range";
import type {
  NdtDtRecord,
  Organization,
  QualificationRecord,
  RangeOfApproval,
  ValidationRecord,
  Welder,
} from "../src/types/db";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  return Object.fromEntries(
    readFileSync(join(root, ".env.local"), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

function publicUrl(base: string, bucket: string, path: string | null) {
  if (!path) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

async function main() {
  const env = loadEnvLocal();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const welderId =
    process.argv[2] ?? "5d36d64d-99d8-420e-b9c3-45239f90af15";
  const wpqId =
    process.argv[3] ?? "bc6c4acb-9929-4f6f-8081-ef12f63e56dc";
  const outputPath =
    process.argv[4] ??
    join(root, "assets", `certificate-${welderId.slice(0, 8)}.pdf`);

  const [{ data: welder }, { data: wpq }] = await Promise.all([
    supabase.from("welders").select("*").eq("id", welderId).single(),
    supabase.from("qualification_records").select("*").eq("id", wpqId).single(),
  ]);

  if (!welder || !wpq || wpq.welder_id !== welderId) {
    throw new Error(`Welder or WPQ not found (${welderId} / ${wpqId})`);
  }

  if ((wpq as QualificationRecord).wpq_status !== "Approved") {
    throw new Error(`WPQ status is ${wpq.wpq_status} — certificate not issued`);
  }

  const [{ data: org }, { data: range }, { data: ndt }, { data: validations }] =
    await Promise.all([
      supabase.from("organizations").select("*").eq("id", wpq.org_id).single(),
      supabase
        .from("ranges_of_approval")
        .select("*")
        .eq("wpq_id", wpqId)
        .maybeSingle(),
      supabase.from("ndt_dt_records").select("*").eq("wpq_id", wpqId),
      supabase
        .from("validation_records")
        .select("*")
        .eq("wpq_id", wpqId)
        .order("validated_on", { ascending: true }),
    ]);

  if (!org) throw new Error("Organization not found");

  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const w = welder as Welder;
  const q = wpq as QualificationRecord;
  const effectiveRange = effectiveRangeForWpq(
    q,
    (range as RangeOfApproval) ?? null,
  );

  const data: CertificateData = {
    org: org as Organization,
    welder: w,
    wpq: q,
    range: effectiveRange,
    ndt: (ndt ?? []) as NdtDtRecord[],
    validations: (validations ?? []) as ValidationRecord[],
    photoUrl: publicUrl(base, "welder-photos", w.photo_path),
    logoUrl: publicUrl(base, "org-assets", (org as Organization).logo_path),
    certNo: buildCertNo(org as Organization, w, q),
  };

  const buffer = await renderToBuffer(<CertificateDocument data={data} />);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buffer);

  console.log(`Certificate written: ${outputPath}`);
  console.log(`Welder: ${w.full_name} (${w.welder_id})`);
  console.log(`Cert no: ${data.certNo}`);
  console.log(`Process: ${q.process}${q.process_2 ? `+${q.process_2}` : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
