"use client";

import { inter, spaceGrotesk } from "@/lib/fonts";
import { RouteErrorView } from "@/components/app/route-error-view";

/** Catches errors in the root layout (error.tsx does not). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
    >
      <body className="bg-parchment font-sans text-onyx antialiased">
        <RouteErrorView error={error} reset={reset} />
      </body>
    </html>
  );
}
