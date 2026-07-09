import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";
import type {
  QualificationSession,
  QualificationSessionStatus,
} from "@/types/db";

const SESSION_STATUS_TONE: Record<
  QualificationSessionStatus,
  "neutral" | "expiring" | "active"
> = {
  Draft: "neutral",
  Pending_NDT: "expiring",
  Closed: "active",
};

function formatSessionStatus(status: QualificationSessionStatus): string {
  return status.replace(/_/g, " ");
}

export function GroupSessionsList({
  sessions,
  countBySession,
  baseHref,
  participantLabel,
  emptyDescription,
}: {
  sessions: QualificationSession[];
  countBySession: Map<string, number>;
  baseHref: string;
  participantLabel: string;
  emptyDescription: string;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center">
        <h3 className="font-display text-lg font-semibold text-onyx">
          No group sessions yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-graphite">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <TableScrollArea>
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-silver bg-frost text-[12px] uppercase tracking-wide text-steel">
            <th className="px-5 py-3 font-medium">Session</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">{participantLabel}</th>
            <th className="px-5 py-3 font-medium">Created</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className="border-b border-silver/70 last:border-0 hover:bg-frost/50"
            >
              <td className="px-5 py-3">
                <Link
                  href={`${baseHref}/${s.id}?step=1`}
                  className="font-medium text-onyx hover:text-ember"
                >
                  {s.label ?? `Session ${s.id.slice(0, 8)}`}
                </Link>
              </td>
              <td className="px-5 py-3">
                <Badge tone={SESSION_STATUS_TONE[s.session_status]}>
                  {formatSessionStatus(s.session_status)}
                </Badge>
              </td>
              <td className="px-5 py-3 text-charcoal">
                {countBySession.get(s.id) ?? 0}
              </td>
              <td className="px-5 py-3 text-charcoal">
                {formatDate(s.created_at)}
              </td>
              <td className="px-5 py-3 text-right">
                <ButtonLink
                  href={`${baseHref}/${s.id}?step=1`}
                  variant="primary"
                  size="sm"
                >
                  <Eye className="h-4 w-4" />
                  Open
                </ButtonLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScrollArea>
  );
}
