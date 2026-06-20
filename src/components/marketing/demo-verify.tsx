import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/utils";
import { WelderIdCardView } from "@/components/verify/welder-id-card-view";

/** Static auditor view for the marketing-site demo QR (`/verify/demo`). */
export function DemoVerifyPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Demo welder ID</span>
        </div>

        <WelderIdCardView
          org={{ name: "Sample Fabrication Co.", location_code: "PLT-A" }}
          welder={{
            full_name: "J. Morrison",
            uid: "WLD-2024-042",
            welder_id: "W#42",
            employer: "Sample Fabrication Co.",
            branch_location: "PLT-A",
          }}
          photoUrl={null}
          logoUrl={null}
          processes={["GMAW (135)"]}
          status="Active"
          expiry="14 Jun 2028"
        />

        <p className="mt-6 text-center text-xs text-steel">
          Demo preview · WeldDoc · {formatDate(new Date())}
        </p>
      </div>
    </main>
  );
}
