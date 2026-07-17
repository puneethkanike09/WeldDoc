/**
 * BullMQ worker: commit validated welder imports in the background.
 * Usage: npm run worker:import
 */
import { Worker } from "bullmq";
import { createAdminClient } from "../src/lib/supabase/admin";
import { commitValidatedImport } from "../src/lib/welders/bulk-import/commit";
import type { ImportDocPaths } from "../src/lib/welders/bulk-import/match-import-docs";
import type { ValidatedImportRow } from "../src/lib/welders/bulk-import/types";
import { getRedisConnection } from "../src/lib/queue/redis";
import {
  WELDER_IMPORT_QUEUE,
  type WelderImportJobData,
} from "../src/lib/queue/welder-import-queue";

async function processJob(data: WelderImportJobData) {
  const supabase = createAdminClient();

  await supabase
    .from("import_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      progress: 5,
    })
    .eq("id", data.importJobId);

  const { data: jobRow, error: loadErr } = await supabase
    .from("import_jobs")
    .select("payload")
    .eq("id", data.importJobId)
    .single();

  if (loadErr || !jobRow) {
    throw new Error(loadErr?.message ?? "Import job payload not found.");
  }

  const payload = jobRow.payload as {
    rows?: ValidatedImportRow[];
    photoPaths?: Record<string, string>;
    docPaths?: ImportDocPaths;
  };
  const rows = payload.rows ?? [];
  if (!rows.length) {
    throw new Error("Import job has no rows.");
  }

  await supabase
    .from("import_jobs")
    .update({ progress: 20 })
    .eq("id", data.importJobId);

  const result = await commitValidatedImport(
    supabase,
    {
      orgId: data.orgId,
      userId: data.userId,
      orgName: data.orgName,
      orgLocation: data.orgLocation,
      welderSeq: data.welderSeq,
    },
    rows,
    undefined,
    payload.photoPaths,
    payload.docPaths,
  );

  await supabase
    .from("import_jobs")
    .update({
      status: "succeeded",
      progress: 100,
      finished_at: new Date().toISOString(),
      summary: {
        weldersCreated: result.weldersCreated,
        qualificationsCreated: result.qualificationsCreated,
      },
      error_message: null,
    })
    .eq("id", data.importJobId);

  return result;
}

const worker = new Worker<WelderImportJobData>(
  WELDER_IMPORT_QUEUE,
  async (job) => processJob(job.data),
  {
    connection: getRedisConnection(),
    concurrency: 1,
  },
);

worker.on("failed", async (job, err) => {
  console.error("[welder-import] job failed", job?.id, err.message);
  if (!job?.data?.importJobId) return;
  try {
    const supabase = createAdminClient();
    await supabase
      .from("import_jobs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: err.message.slice(0, 2000),
      })
      .eq("id", job.data.importJobId)
      .neq("status", "succeeded");
  } catch (e) {
    console.error("[welder-import] failed to persist error", e);
  }
});

worker.on("ready", () => {
  console.log("[welder-import] worker ready");
});

console.log("[welder-import] starting…");
