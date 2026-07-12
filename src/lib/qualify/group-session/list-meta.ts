import type { QualificationSession } from "@/types/db";
import { resolveGroupSessionDisplayLabel, type GroupSessionParticipantKind } from "./label";

type MemberRow = {
  session_id: string;
  member_status: string;
  welders?: { welder_id: string | null } | { welder_id: string | null }[] | null;
  operators?: { operator_id: string | null } | { operator_id: string | null }[] | null;
};

function nestedPlantId(
  row: MemberRow,
  kind: GroupSessionParticipantKind,
): string | null {
  const nested = kind === "welder" ? row.welders : row.operators;
  if (!nested) return null;
  const item = Array.isArray(nested) ? nested[0] : nested;
  if (!item) return null;
  return kind === "welder"
    ? (item as { welder_id: string | null }).welder_id
    : (item as { operator_id: string | null }).operator_id;
}

export function buildGroupSessionListMeta(
  sessions: QualificationSession[],
  memberRows: MemberRow[],
  kind: GroupSessionParticipantKind,
) {
  const countBySession = new Map<string, number>();
  const canDeleteBySession = new Map<string, boolean>();
  const plantIdsBySession = new Map<string, string[]>();
  const displayLabelBySession = new Map<string, string>();

  for (const session of sessions) {
    canDeleteBySession.set(session.id, true);
  }

  for (const row of memberRows) {
    const sid = row.session_id;
    countBySession.set(sid, (countBySession.get(sid) ?? 0) + 1);
    if (row.member_status === "Approved") {
      canDeleteBySession.set(sid, false);
    }
    const plantId = nestedPlantId(row, kind);
    if (plantId) {
      const list = plantIdsBySession.get(sid) ?? [];
      list.push(plantId);
      plantIdsBySession.set(sid, list);
    }
  }

  for (const session of sessions) {
    displayLabelBySession.set(
      session.id,
      resolveGroupSessionDisplayLabel(
        session,
        plantIdsBySession.get(session.id) ?? [],
        kind,
      ),
    );
  }

  return { countBySession, canDeleteBySession, displayLabelBySession };
}
