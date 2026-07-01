"use client";

import { cn } from "@/lib/utils";

export interface GroupSessionParticipant {
  id: string;
  name: string;
  plantId: string | null;
  hasQualification: boolean;
  status?: string;
}

export function GroupSessionParticipants({
  participants,
  className,
}: {
  participants: GroupSessionParticipant[];
  className?: string;
}) {
  if (participants.length === 0) return null;

  return (
    <div
      className={cn(
        "mb-6 rounded-[10px] border border-silver bg-frost/40 px-4 py-3",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-steel">
        Participants ({participants.length})
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
              p.hasQualification
                ? "border-silver bg-panel text-charcoal"
                : "border-expiring/40 bg-expiring/10 text-[#8a6a00]",
            )}
          >
            <span className="font-medium">{p.name}</span>
            {p.plantId ? (
              <span className="font-mono text-xs text-steel">{p.plantId}</span>
            ) : null}
            {!p.hasQualification ? (
              <span className="text-xs">· missing qualification</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
