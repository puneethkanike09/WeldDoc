import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { NewGroupSessionButton } from "@/components/app/group-qualify-button";
import { GroupSessionsList } from "@/components/qualify/group-sessions-list";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { buildGroupSessionListMeta } from "@/lib/qualify/group-session/list-meta";
import { requireWelderWorkspace } from "@/lib/standards/active-standard.server";
import type { QualificationSession } from "@/types/db";

export const metadata: Metadata = { title: "Group qualification sessions" };

export default async function WelderGroupSessionsPage() {
  await requireWelderWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("qualification_sessions")
    .select("*")
    .eq("org_id", org.id)
    .eq("standard", "ISO_9606_1")
    .order("created_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: memberRows } = sessionIds.length
    ? await supabase
        .from("qualification_session_members")
        .select("session_id, member_status, welders(welder_id)")
        .in("session_id", sessionIds)
    : { data: [] };

  const { countBySession, canDeleteBySession, displayLabelBySession } =
    buildGroupSessionListMeta(
      (sessions ?? []) as QualificationSession[],
      memberRows ?? [],
      "welder",
    );

  const baseHref = "/welders/qualify/group";

  return (
    <>
      <PageHeader
        title="Group qualification"
        description="Shared ISO 9606-1 test sessions for multiple welders."
      >
        <NewGroupSessionButton href={`${baseHref}/new`} />
      </PageHeader>
      <div className="page-content">
        <GroupSessionsList
          sessions={(sessions ?? []) as QualificationSession[]}
          countBySession={countBySession}
          displayLabelBySession={displayLabelBySession}
          canDeleteBySession={canDeleteBySession}
          baseHref={baseHref}
          participantLabel="Welders"
          participantKind="welder"
          emptyDescription="Start a group session when several welders take the same test together."
        />
      </div>
    </>
  );
}
