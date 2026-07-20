import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Full-width banner shown at the top of the app when the org is read-only
 * (trial elapsed / subscription lapsed). Links to the billing settings.
 */
export function ReadOnlyBanner({ message }: { message: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {message}
      </span>
      <Link
        href="/settings?tab=billing"
        className="shrink-0 rounded-[10px] bg-amber-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:opacity-90"
      >
        View plans
      </Link>
    </div>
  );
}
