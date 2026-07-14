/**
 * Demo: import realistic test welders through the full pipeline.
 * Usage: npx tsx scripts/demo-welder-import.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { commitValidatedImport } from "../src/lib/welders/bulk-import/commit";
import { TEMPLATE_COLUMNS, IMPORT_SHEET_NAME } from "../src/lib/welders/bulk-import/columns";
import { parseImportWorkbook } from "../src/lib/welders/bulk-import/parse";
import { validateParsedImport } from "../src/lib/welders/bulk-import/validate";
import {
  matchPhotosToWelders,
  type PhotoFile,
} from "../src/lib/welders/bulk-import/match-import-photos";
import { buildImportTemplateBuffer } from "../src/lib/welders/bulk-import/template";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env");
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

function buildDemoWorkbook() {
  const rows = [
    {
      plant_welder_id: "W#9901",
      full_name: "Demo Legacy Welder",
      date_of_birth: "1985-04-12",
      id_method: "Passport",
      id_number: "DEMO-LEG-9901",
      photo_filename: "W#9901.jpg",
      process: "135",
      joint_type: "BW",
      position: "PF",
      base_material_group: "1",
      filler_group: "FM1",
      test_thickness_mm: 12,
      product: "Plate",
      date_of_welding: "2019-06-10",
      expiry_date: "2026-03-01",
      continuity_last_verified: "2025-12-01",
      continuity_history:
        "2019-12-01;2020-06-01;2021-06-01;2023-06-01;2025-12-01",
      revalidation_history: "2021-06-10;2023-06-10",
      revalidation_method: "9.3a",
    },
    {
      plant_welder_id: "W#9902",
      full_name: "Demo Auto-ID Welder",
      date_of_birth: "1992-08-03",
      id_method: "Aadhar",
      id_number: "DEMO-AUTO-9902",
      photo_filename: "W#9902.png",
      process: "136",
      joint_type: "BW",
      position: "PA",
      base_material_group: "1",
      filler_group: "FM1",
      test_thickness_mm: 10,
      product: "Plate",
      date_of_welding: "2024-11-15",
      expiry_date: "2026-11-15",
      continuity_last_verified: "2026-01-10",
      continuity_history: "2025-05-15;2025-11-15;2026-01-10",
      revalidation_method: "9.3b",
    },
    {
      plant_welder_id: "W#9902",
      full_name: "Demo Auto-ID Welder",
      process: "121",
      joint_type: "FW",
      position: "PA",
      base_material_group: "1",
      filler_group: "FM1",
      test_thickness_mm: 8,
      product: "Plate",
      date_of_welding: "2025-06-01",
      expiry_date: "2027-06-01",
      revalidation_method: "9.3b",
    },
    {
      plant_welder_id: "W#9903",
      full_name: "Demo Welder Only",
      date_of_birth: "1998-01-20",
      id_method: "ID Card",
      id_number: "DEMO-ONLY-9903",
    },
  ];

  const wb = XLSX.utils.book_new();
  const header = [...TEMPLATE_COLUMNS];
  const aoa = [
    header,
    ...rows.map((row) =>
      header.map((col) => {
        const v = row[col as keyof typeof row];
        return v ?? "";
      }),
    ),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), IMPORT_SHEET_NAME);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

/** Minimal valid JPEG header + padding */
function fakeJpeg(name: string): PhotoFile {
  const bytes = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ...Array(200).fill(0xab),
    0xff, 0xd9,
  ]);
  return { filename: name, bytes, mime: "image/jpeg" };
}

function fakePng(name: string): PhotoFile {
  const bytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...Array(100).fill(0),
  ]);
  return { filename: name, bytes, mime: "image/png" };
}

async function cleanup(supabase: ReturnType<typeof createClient>, orgId: string) {
  for (const plantId of ["W#9901", "W#9902", "W#9903"]) {
    const { data } = await supabase
      .from("welders")
      .select("id")
      .eq("org_id", orgId)
      .eq("welder_id", plantId)
      .maybeSingle();
    if (data?.id) {
      await supabase.from("welders").delete().eq("id", data.id);
    }
  }
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const targetOrgId = process.env.DEMO_IMPORT_ORG_ID;

  let profile: { id: string; org_id: string } | null = null;
  let org: {
    id: string;
    name: string;
    location_code: string | null;
    welder_seq: number;
  } | null = null;

  if (targetOrgId) {
    const { data: o } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", targetOrgId)
      .single();
    if (!o) throw new Error(`Org not found: ${targetOrgId}`);
    org = o;
    const { data: p } = await supabase
      .from("profiles")
      .select("id, org_id")
      .eq("org_id", targetOrgId)
      .limit(1)
      .maybeSingle();
    if (!p) throw new Error(`No profile for org ${targetOrgId}`);
    profile = p;
  } else {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, org_id")
      .limit(1)
      .single();
    if (!p) throw new Error("No profile in DB — sign up first.");
    profile = p;
    const { data: o } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id)
      .single();
    if (!o) throw new Error("No org.");
    org = o;
  }

  console.log("=== WeldDoc Demo Import ===");
  console.log(`Org: ${org.name}`);
  console.log(`Engineer profile: ${profile.id.slice(0, 8)}…\n`);

  await cleanup(supabase, org.id);

  const buffer = buildDemoWorkbook();
  const outXlsx = join(root, "scripts", "demo-import-test.xlsx");
  writeFileSync(outXlsx, Buffer.from(buffer));
  console.log(`Wrote test Excel: ${outXlsx}\n`);

  const templateBuf = buildImportTemplateBuffer();
  const templateSheets = XLSX.read(templateBuf, { type: "buffer" }).SheetNames;
  console.log("Download template sheets:", templateSheets.join(", "));

  const { rows: parsed, fileError } = parseImportWorkbook(buffer);
  console.log("\n--- Step 1: Parse ---");
  if (fileError) throw new Error(fileError);
  console.log(`Parsed ${parsed.length} data rows`);

  const { data: existing } = await supabase
    .from("welders")
    .select("welder_id, id_number")
    .eq("org_id", org.id);

  const existingPlantIds = (existing ?? [])
    .map((w) => w.welder_id)
    .filter(Boolean) as string[];

  const validation = validateParsedImport(parsed, existingPlantIds, {
    existingIdNumbers: (existing ?? []).map((w) => w.id_number).filter(Boolean),
    welderSeq: org.welder_seq,
  });

  console.log("\n--- Step 2: Validate ---");
  console.log(`OK: ${validation.ok}`);
  console.log(
    `Summary: ${validation.summary.totalRows} rows, ${validation.summary.welderCount} welders, ${validation.summary.qualificationCount} quals, ${validation.summary.errorCount} errors`,
  );
  if (validation.warnings.length) {
    console.log("Warnings:");
    for (const w of validation.warnings) {
      console.log(`  row ${w.excelRow ?? "?"}: ${w.message}`);
    }
  }
  if (!validation.ok) {
    for (const e of validation.errors) {
      console.log(`  ERROR row ${e.excelRow} ${e.column}: ${e.message}`);
    }
    throw new Error("Validation failed.");
  }

  console.log("\nAssigned plant IDs in preview:");
  for (const r of validation.rows) {
    console.log(
      `  row ${r.excelRow}: ${r.welder.plantWelderId} — ${r.welder.fullName}` +
        (r.qualification
          ? ` | qual ${r.qualification.process} expiry ${r.qualification.expiryDate} status ${r.qualification.wpqStatus}`
          : " | welder-only"),
    );
  }

  const photos: PhotoFile[] = [fakeJpeg("W#9901.jpg"), fakePng("W#9902.png")];
  const { matches, results: photoResults } = matchPhotosToWelders(
    validation.rows,
    photos,
  );

  console.log("\n--- Step 3: Photo match ---");
  for (const p of photoResults) {
    console.log(`  ${p.plantWelderId}: ${p.status}${p.filename ? ` (${p.filename})` : ""}`);
  }
  // Each welder matches its own photo by plant ID when photo_filename is blank.
  const safeMatches = new Map<string, PhotoFile>();
  if (matches.has("W#9901")) safeMatches.set("W#9901", matches.get("W#9901")!);
  if (matches.has("W#9902")) safeMatches.set("W#9902", matches.get("W#9902")!);
  console.log(`  W#9903: no dedicated photo → import continues without photo`);

  console.log("\n--- Step 4: Commit to database (no photos — script context) ---");
  const commit = await commitValidatedImport(
    supabase,
    {
      orgId: org.id,
      userId: profile.id,
      orgName: org.name,
      orgLocation: org.location_code,
      welderSeq: org.welder_seq,
    },
    validation.rows,
    undefined,
  );
  console.log(
    `Created ${commit.weldersCreated} welder(s), ${commit.qualificationsCreated} qualification(s)`,
  );

  console.log("\n--- Step 4b: Upload photos via service role (simulates app commit) ---");
  for (const [plantId, photo] of safeMatches) {
    const { data: w } = await supabase
      .from("welders")
      .select("id")
      .eq("org_id", org.id)
      .eq("welder_id", plantId)
      .single();
    if (!w) continue;
    const path = `${org.id}/${Date.now()}-${photo.filename.replace(/#/g, "")}`;
    const { error } = await supabase.storage
      .from("welder-photos")
      .upload(path, photo.bytes, { contentType: photo.mime, upsert: false });
    if (error) {
      console.log(`  ${plantId}: photo upload failed — ${error.message}`);
    } else {
      await supabase.from("welders").update({ photo_path: path }).eq("id", w.id);
      console.log(`  ${plantId}: photo uploaded → ${path}`);
    }
  }

  console.log("\n--- Step 5: Verify in DB ---");
  for (const plantId of ["W#9901", "W#9902", "W#9903"]) {
    const { data: w } = await supabase
      .from("welders")
      .select("id, welder_id, full_name, photo_path, is_new_welder")
      .eq("org_id", org.id)
      .eq("welder_id", plantId)
      .maybeSingle();
    if (!w) {
      console.log(`  ${plantId}: NOT FOUND`);
      continue;
    }
    const { data: wpqs } = await supabase
      .from("qualification_records")
      .select("id, process, expiry_date, continuity_last_verified, wpq_status, is_legacy")
      .eq("welder_id", w.id);
    console.log(`  ${plantId} ${w.full_name} (${w.welder_id})`);
    console.log(`    photo: ${w.photo_path ? "yes" : "no"} | new_welder: ${w.is_new_welder}`);
    for (const q of wpqs ?? []) {
      console.log(
        `    qual ${q.process}: expiry ${q.expiry_date}, continuity ${q.continuity_last_verified}, ${q.wpq_status}, legacy=${q.is_legacy}`,
      );
    }
    if (plantId === "W#9901" && wpqs?.[0]?.id) {
      const { data: vrec } = await supabase
        .from("validation_records")
        .select("kind, validated_on, note")
        .eq("wpq_id", wpqs[0].id)
        .order("validated_on", { ascending: true });
      if (vrec?.length) {
        console.log(`    validation history (${vrec.length} records):`);
        for (const v of vrec) {
          console.log(`      ${v.kind} on ${v.validated_on}`);
        }
      }
    }
  }

  console.log("\n=== Demo complete ===");
  console.log("View in app: /welders (look for Demo Legacy / Demo Auto-ID / Demo Welder Only)");
  console.log("Test file kept at scripts/demo-import-test.xlsx");
}

main().catch((err) => {
  console.error("\nDemo failed:", err.message);
  process.exit(1);
});
