"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isRecoverableNavigationError,
  reloadOnceForNavigationRecovery,
} from "@/lib/navigation-recovery";

export function RouteErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isRecoverableNavigationError(error)) {
      reloadOnceForNavigationRecovery();
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-expiring/20 text-[#8a6a00]">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <div className="max-w-md space-y-2">
        <h1 className="font-display text-xl font-semibold text-onyx">
          This page couldn&apos;t load
        </h1>
        <p className="text-[15px] text-graphite">
          That can happen after an update or on a weak connection. Reload to fetch
          the latest version.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Reload page
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
