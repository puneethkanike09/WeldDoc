import { NextRequest, NextResponse } from "next/server";
import { runExpiryAlertsJob } from "@/lib/expiry-alerts/run-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.VERCEL === "1" && !secret) {
    return new NextResponse("CRON_SECRET not configured", { status: 503 });
  }
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  try {
    const result = await runExpiryAlertsJob();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[expiry-alerts] job failed", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Job failed",
      },
      { status: 500 },
    );
  }
}
