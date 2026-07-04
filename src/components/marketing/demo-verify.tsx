import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/utils";
import type { IdCardQualRow } from "@/lib/iso9606/id-card-model";
import { WelderIdCardView } from "@/components/verify/welder-id-card-view";

const DEMO_ROWS: IdCardQualRow[] = [
  {
    process: "FCAW(136)",
    positionBw: "PA",
    positionFw: "PA/PB/PF",
    thicknessBw: "≥ 3mm",
    thicknessFw: "≥ 3mm",
    od: "≥ 500mm",
    jointType: "BW/FW",
    fmGroup: "FM1, FM2",
    testDate: "21 Jun 2024",
    validUpto: "20 Jun 2028",
  },
];

/** Static auditor view for the marketing-site demo QR (`/verify/demo`). */
export function DemoVerifyPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Demo welder ID</span>
        </div>

        <WelderIdCardView
          orgName="SMS group"
          welderName="Bebina Swain"
          welderNo="W421"
          uid="WLD-2024-042"
          photoUrl={null}
          logoUrl={null}
          rows={DEMO_ROWS}
          status="Active"
          expiry="20 Jun 2028"
          employer="SMS group"
          site="PLT-A"
          showUid={false}
        />

        <p className="mt-6 text-center text-xs text-steel">
          Demo preview · WeldDoc · {formatDate(new Date())}
        </p>
      </div>
    </main>
  );
}
