import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { NewGroupSessionButton } from "@/components/app/group-qualify-button";
import { GroupSessionsList } from "@/components/qualify/group-sessions-list";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireOperatorWorkspace } from "@/lib/standards/active-standard.server";
import type { QualificationSession } from "@/types/db";

export const metadata: Metadata = { title: "Group qualification sessions" };

export default async function OperatorGroupSessionsPage() {
  await requireOperatorWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("qualification_sessions")
    .select("*")
    .eq("org_id", org.id)
    .eq("standard", "ISO_14732")
    .order("created_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: memberRows } = sessionIds.length
    ? await supabase
        .from("qualification_session_members")
        .select("session_id")
        .in("session_id", sessionIds)
    : { data: [] };

  const countBySession = new Map<string, number>();
  for (const m of memberRows ?? []) {
    const sid = (m as { session_id: string }).session_id;
    countBySession.set(sid, (countBySession.get(sid) ?? 0) + 1);
  }

  const baseHref = "/operators/qualify/group";

  return (
    <>
      <PageHeader
        title="Group qualification"
        description="Shared ISO 14732 test sessions for multiple operators."
      >
        <NewGroupSessionButton href={`${baseHref}/new`} />
      </PageHeader>
      <div className="px-8 py-8">
        <GroupSessionsList
          sessions={(sessions ?? []) as QualificationSession[]}
          countBySession={countBySession}
          baseHref={baseHref}
          newHref={`${baseHref}/new`}
          participantLabel="Operators"
          emptyDescription="Start a group session when several operators take the same test together."
        />
      </div>
    </>
  );
}
