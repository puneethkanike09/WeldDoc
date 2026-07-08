import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { loadWelderIdCardView } from "@/lib/id-card/view-data";
import { IdCardPrintShell } from "@/components/verify/id-card-print-shell";
import { WelderIdCardView } from "@/components/verify/welder-id-card-view";
import { formatDate } from "@/lib/utils";
import type { Welder } from "@/types/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("welders")
    .select("full_name")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  return { title: data ? `ID card — ${data.full_name}` : "ID card" };
}

export default async function WelderIdCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: welder } = await supabase
    .from("welders")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!welder) notFound();

  const view = await loadWelderIdCardView(supabase, welder as Welder);

  return (
    <IdCardPrintShell
      backHref={`/welders/${id}`}
      backLabel="Back to profile"
      badge="Welder ID card"
      showPrint={false}
    >
      <WelderIdCardView {...view} />
      <p className="mt-6 text-center text-xs text-steel print:mt-4">
        WeldDoc · {formatDate(new Date())}
      </p>
    </IdCardPrintShell>
  );
}
