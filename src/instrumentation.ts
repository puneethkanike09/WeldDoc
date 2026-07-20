export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { startAlertScheduler } = await import(
    "@/lib/expiry-alerts/scheduler"
  );
  startAlertScheduler();
}
