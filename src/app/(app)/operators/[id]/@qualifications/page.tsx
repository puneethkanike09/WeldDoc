import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { QualificationPanelSkeleton } from "@/components/app/skeletons";
import { loadOperatorProfileQualifications } from "@/lib/operators/load-profile-qualifications";
import { OperatorQualifications } from "../operator-qualifications";

export default async function OperatorQualificationsSlot({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oq?: string; page?: string }>;
}) {
  const { id } = await params;
  const { oq, page } = await searchParams;
  await requireSession();
  const supabase = await createClient();

  const data = await loadOperatorProfileQualifications(
    supabase,
    id,
    oq,
    page,
  );

  return (
    <Suspense fallback={<QualificationPanelSkeleton />}>
      <OperatorQualifications
        operatorId={id}
        listItems={data.listItems}
        selected={data.selected}
        selectedId={data.selectedId}
        totalCount={data.totalCount}
        page={data.page}
      />
    </Suspense>
  );
}
