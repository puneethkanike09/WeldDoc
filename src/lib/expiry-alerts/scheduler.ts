import cron from "node-cron";
import { runExpiryAlertsJob } from "@/lib/expiry-alerts/run-job";

let started = false;
let running = false;

/**
 * Single global minute cron for expiry alert digests.
 * Enable with ENABLE_ALERT_SCHEDULER=true (EC2 / PM2 production).
 */
export function startAlertScheduler(): void {
  if (started) return;
  if (process.env.ENABLE_ALERT_SCHEDULER !== "true") return;

  started = true;
  console.info("[alert-scheduler] starting (* * * * *)");

  cron.schedule("* * * * *", async () => {
    if (running) {
      console.warn("[alert-scheduler] previous tick still running — skip");
      return;
    }
    running = true;
    try {
      const result = await runExpiryAlertsJob();
      if (result.processedOrgs > 0 || result.totalSent > 0) {
        console.info(
          "[alert-scheduler]",
          `processed=${result.processedOrgs} sent=${result.totalSent}`,
          result.summary,
        );
      }
    } catch (err) {
      console.error(
        "[alert-scheduler] tick failed",
        err instanceof Error ? err.message : err,
      );
    } finally {
      running = false;
    }
  });
}
