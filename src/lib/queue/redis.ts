import IORedis from "ioredis";

let connection: IORedis | null = null;

/** Shared Redis connection for BullMQ (app enqueue + worker). */
export function getRedisConnection(): IORedis {
  if (connection) return connection;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    throw new Error("REDIS_URL is not set.");
  }
  connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return connection;
}

export function redisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}
