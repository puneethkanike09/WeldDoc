import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const WELDER_IMPORT_QUEUE = "welder-import";

export type WelderImportJobData = {
  importJobId: string;
  orgId: string;
  userId: string;
  orgName: string;
  orgLocation: string | null;
  welderSeq: number;
};

let queue: Queue<WelderImportJobData> | null = null;

export function getWelderImportQueue(): Queue<WelderImportJobData> {
  if (!queue) {
    queue = new Queue<WelderImportJobData>(WELDER_IMPORT_QUEUE, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return queue;
}

export async function enqueueWelderImport(
  data: WelderImportJobData,
): Promise<string> {
  const job = await getWelderImportQueue().add("commit", data, {
    jobId: data.importJobId,
  });
  return job.id ?? data.importJobId;
}
