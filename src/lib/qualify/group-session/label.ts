import type { SupabaseClient } from "@supabase/supabase-js";
import { snapshotStr } from "./form-helpers";
import type {
  QualificationSession,
  QualificationSessionMember,
} from "@/types/db";

export type GroupSessionParticipantKind = "welder" | "operator";

function parsePlantNumber(
  raw: string | null | undefined,
  kind: GroupSessionParticipantKind,
): number | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const tagged = kind === "welder" ? /^W#(\d+)$/i.exec(s) : /^O#(\d+)$/i.exec(s);
  if (tagged) return parseInt(tagged[1], 10);
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return null;
}

/** e.g. 141- W#2, 4, 5, 6 */
export function formatGroupSessionLabel(
  process: string | null | undefined,
  plantIds: (string | null | undefined)[],
  kind: GroupSessionParticipantKind,
): string {
  const nums = plantIds
    .map((id) => parsePlantNumber(id, kind))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  if (nums.length === 0) return "";

  const tag = kind === "welder" ? "W#" : "O#";
  const list =
    nums.length === 1
      ? `${tag}${nums[0]}`
      : `${tag}${nums[0]}, ${nums.slice(1).join(", ")}`;

  const p = process?.trim();
  return p ? `${p}- ${list}` : list;
}

export async function fetchSessionPlantIds(
  supabase: SupabaseClient,
  members: QualificationSessionMember[],
  kind: GroupSessionParticipantKind,
): Promise<string[]> {
  const active = members.filter((m) => m.member_status !== "Removed");
  if (active.length === 0) return [];

  if (kind === "welder") {
    const ids = active.map((m) => m.welder_id).filter(Boolean) as string[];
    if (ids.length === 0) return [];
    const { data } = await supabase
      .from("welders")
      .select("welder_id")
      .in("id", ids);
    return (data ?? [])
      .map((row) => (row as { welder_id: string | null }).welder_id)
      .filter(Boolean) as string[];
  }

  const ids = active.map((m) => m.operator_id).filter(Boolean) as string[];
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("operators")
    .select("operator_id")
    .in("id", ids);
  return (data ?? [])
    .map((row) => (row as { operator_id: string | null }).operator_id)
    .filter(Boolean) as string[];
}

export function resolveGroupSessionDisplayLabel(
  session: QualificationSession,
  plantIds: (string | null | undefined)[],
  kind: GroupSessionParticipantKind,
): string {
  const stored = session.label?.trim();
  if (stored) return stored;

  const computed = formatGroupSessionLabel(
    snapshotStr(session.shared_plan, "process"),
    plantIds,
    kind,
  );
  if (computed) return computed;

  return `Session ${session.id.slice(0, 8)}`;
}

export async function syncGroupSessionLabel(
  supabase: SupabaseClient,
  orgId: string,
  sessionId: string,
  session: QualificationSession,
  members: QualificationSessionMember[],
  kind: GroupSessionParticipantKind,
): Promise<string> {
  const plantIds = await fetchSessionPlantIds(supabase, members, kind);
  const label = formatGroupSessionLabel(
    snapshotStr(session.shared_plan, "process"),
    plantIds,
    kind,
  );

  if (label) {
    await supabase
      .from("qualification_sessions")
      .update({ label, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("org_id", orgId);
  }

  return label || `Session ${sessionId.slice(0, 8)}`;
}
