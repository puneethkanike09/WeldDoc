import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { QualificationPanelSkeleton } from "@/components/app/skeletons";
import { loadWelderProfileQualifications } from "@/lib/welders/load-profile-qualifications";
import { WelderQualifications } from "../welder-qualifications";

export default async function WelderQualificationsSlot({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wpq?: string; page?: string }>;
}) {
  const { id } = await params;
  const { wpq, page } = await searchParams;
  await requireSession();
  const supabase = await createClient();

  const data = await loadWelderProfileQualifications(supabase, id, wpq, page);

  return (
    <Suspense fallback={<QualificationPanelSkeleton />}>
      <WelderQualifications
        welderId={id}
        listItems={data.listItems}
        selected={data.selected}
        selectedId={data.selectedId}
        totalCount={data.totalCount}
        page={data.page}
      />
    </Suspense>
  );
}
