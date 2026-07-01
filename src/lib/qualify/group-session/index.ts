import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  QualificationSession,
  QualificationSessionMember,
} from "@/types/db";
import { materializeOperatorMembers } from "./operator";
import { materializeWelderMembers } from "./welder";

export async function loadSession(
  supabase: SupabaseClient,
  orgId: string,
  sessionId: string,
  expectedStandard?: QualificationSession["standard"],
): Promise<{
  session: QualificationSession;
  members: QualificationSessionMember[];
} | null> {
  const [{ data: session }, { data: members }] = await Promise.all([
    supabase
      .from("qualification_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("qualification_session_members")
      .select("*")
      .eq("session_id", sessionId)
      .eq("org_id", orgId)
      .order("created_at"),
  ]);

  if (!session) return null;
  const typed = session as QualificationSession;
  if (expectedStandard && typed.standard !== expectedStandard) return null;

  return {
    session: typed,
    members: (members ?? []) as QualificationSessionMember[],
  };
}

export function sessionHasApprovedMember(
  members: QualificationSessionMember[],
): boolean {
  return members.some((m) => m.member_status === "Approved");
}

export async function findSessionForQualification(
  supabase: SupabaseClient,
  qualificationId: string,
): Promise<{ sessionId: string; label: string | null } | null> {
  const { data } = await supabase
    .from("qualification_session_members")
    .select("session_id, qualification_sessions(label)")
    .eq("qualification_id", qualificationId)
    .maybeSingle();

  if (!data) return null;

  const sessionId = String((data as { session_id: string }).session_id);
  const sessions = (data as { qualification_sessions: unknown })
    .qualification_sessions;
  const sessionMeta = Array.isArray(sessions) ? sessions[0] : sessions;
  const label =
    sessionMeta &&
    typeof sessionMeta === "object" &&
    "label" in sessionMeta
      ? ((sessionMeta as { label: string | null }).label ?? null)
      : null;

  return { sessionId, label };
}

export async function materializeSessionMembers(
  supabase: SupabaseClient,
  orgId: string,
  session: QualificationSession,
  members: QualificationSessionMember[],
): Promise<void> {
  const active = members.filter((m) => m.member_status !== "Removed");
  if (active.length === 0) return;

  if (session.standard === "ISO_9606_1") {
    await materializeWelderMembers(
      supabase,
      orgId,
      active,
      session.shared_plan,
      session.shared_test_piece,
    );
    return;
  }

  if (session.standard === "ISO_14732") {
    await materializeOperatorMembers(
      supabase,
      orgId,
      active,
      session.shared_plan,
      session.shared_test_piece,
    );
  }
}
