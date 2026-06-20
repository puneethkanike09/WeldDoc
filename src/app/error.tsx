"use client";

import { RouteErrorView } from "@/components/app/route-error-view";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} />;
}
