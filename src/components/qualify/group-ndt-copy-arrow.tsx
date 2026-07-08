"use client";

import { ArrowDown } from "lucide-react";

export function GroupNdtCopyArrow({
  fromName,
  onCopy,
}: {
  fromName: string;
  onCopy: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="flex justify-center py-1">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver bg-panel text-steel transition-colors hover:border-onyx/20 hover:bg-frost hover:text-onyx"
        aria-label={`Copy test date and report reference from ${fromName}`}
        title={`Same test date & report ref as ${fromName}`}
        onClick={onCopy}
      >
        <ArrowDown className="size-4" aria-hidden />
      </button>
    </div>
  );
}
