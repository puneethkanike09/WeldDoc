import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

/** Static auditor view for the marketing-site demo QR (`/verify/demo`). */
export function DemoVerifyPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Demo verification</span>
        </div>

        <div className="rounded-[var(--radius-feature)] bg-active p-6 text-center text-white">
          <ShieldCheck className="mx-auto h-10 w-10" />
          <p className="mt-3 font-display text-2xl font-bold tracking-tight">
            QUALIFIED
          </p>
          <p className="mt-1 text-sm opacity-90">
            Sample welder — EN ISO 9606-1 qualification on record.
          </p>
        </div>

        <div className="mt-4 rounded-[var(--radius-card)] border border-silver bg-white p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-20 w-20 place-items-center rounded-[12px] bg-onyx/5 font-display text-2xl font-semibold text-graphite">
              J
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-onyx">
                J. Morrison
              </h1>
              <p className="font-mono text-[13px] text-charcoal">WLD-2024-042</p>
              <div className="mt-1.5">
                <Badge tone="active">Active</Badge>
              </div>
            </div>
          </div>
          <p className="mt-4 border-t border-silver pt-3 text-sm text-graphite">
            Sample Fabrication Co.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <h2 className="px-1 font-display text-sm font-semibold uppercase tracking-wide text-steel">
            Valid qualifications
          </h2>
          <div className="rounded-[var(--radius-card)] border border-silver bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-semibold text-onyx">
                GMAW (135) · Butt
              </p>
              <span className="text-xs text-steel">exp. 14 Jun 2028</span>
            </div>
            <p className="mt-0.5 text-[13px] text-graphite">
              Position PF — vertical up · Plate
            </p>
            <p className="mt-2 rounded-[8px] bg-frost p-2.5 text-[12.5px] leading-snug text-charcoal">
              PF · BW · 3–24 mm · Group 1
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-steel">
          Demo preview · WeldDoc · {formatDate(new Date())}
        </p>
      </div>
    </main>
  );
}
