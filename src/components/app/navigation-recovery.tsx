"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isRecoverableNavigationError,
  reloadOnceForNavigationRecovery,
} from "@/lib/navigation-recovery";

/** Minimum time in background before we refresh RSC data on return. */
const STALE_TAB_MS = 60_000;

/**
 * Catches chunk / flight load failures and refreshes stale tabs after backgrounding.
 * Mount once in the root layout.
 */
export function NavigationRecovery() {
  const router = useRouter();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const reason = event.error ?? event.message;
      if (!isRecoverableNavigationError(reason)) return;
      reloadOnceForNavigationRecovery();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!isRecoverableNavigationError(event.reason)) return;
      event.preventDefault();
      reloadOnceForNavigationRecovery();
    };

    let hiddenAt: number | null = null;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (document.visibilityState !== "visible" || hiddenAt === null) return;

      const idleMs = Date.now() - hiddenAt;
      hiddenAt = null;
      if (idleMs >= STALE_TAB_MS) {
        router.refresh();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
