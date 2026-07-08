import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import {
  loadOperatorIdCardView,
  loadWelderIdCardView,
} from "@/lib/id-card/view-data";
import type { Operator, Welder } from "@/types/db";
import { ShieldAlert } from "lucide-react";
import { DemoVerifyPage } from "@/components/marketing/demo-verify";
import { WelderIdCardView } from "@/components/verify/welder-id-card-view";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Welder ID",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (token === "demo") {
    return <DemoVerifyPage />;
  }

  const supabase = createAdminClient();

  const { data: welder } = await supabase
    .from("welders")
    .select("*")
    .eq("qr_token", token)
    .maybeSingle();

  if (!welder) {
    const { data: operator } = await supabase
      .from("operators")
      .select("*")
      .eq("qr_token", token)
      .maybeSingle();

    if (operator) {
      const view = await loadOperatorIdCardView(supabase, operator as Operator);
      return (
        <main className="min-h-screen bg-parchment px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <span className="text-xs text-steel">Live operator ID</span>
            </div>
            <WelderIdCardView {...view} />
            <p className="mt-6 text-center text-xs text-steel">
              Verified live via Weld.Doc · {formatDate(new Date())}
            </p>
          </div>
        </main>
      );
    }

    return <NotFound />;
  }
  const w = welder as Welder;
  const view = await loadWelderIdCardView(supabase, w);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Live welder ID</span>
        </div>

        <WelderIdCardView {...view} />

        <p className="mt-6 text-center text-xs text-steel">
          Verified live via Weld.Doc · {formatDate(new Date())}
        </p>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-parchment px-4">
      <div className="max-w-sm text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-expired" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-onyx">
          Welder not found
        </h1>
        <p className="mt-2 text-graphite">
          This QR code does not match any welder on record. Please check with
          the welding engineer.
        </p>
      </div>
    </main>
  );
}
