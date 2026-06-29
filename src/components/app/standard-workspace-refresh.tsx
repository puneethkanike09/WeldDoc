"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { consumeStandardChangedFlag } from "@/lib/standards/active-standard";

const WORKSPACE_PATHS = [
  "/dashboard",
  "/welders",
  "/operators",
  "/reports",
  "/masterlist",
  "/settings",
];

function isWorkspacePath(pathname: string): boolean {
  return WORKSPACE_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

/**
 * After switching standards the client Router Cache can serve a stale RSC
 * payload (staleTimes.dynamic). Re-fetch server data when a workspace route
 * loads with a pending standard change.
 */
export function StandardWorkspaceRefresh() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isWorkspacePath(pathname)) return;
    if (!consumeStandardChangedFlag()) return;
    router.refresh();
  }, [pathname, router]);

  return null;
}
