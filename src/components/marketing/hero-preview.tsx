import { QrGlyph } from "@/components/brand/qr-glyph";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export function HeroPreview() {
  return (
    <div className="relative">
      {/* Main certificate card */}
      <div className="relative z-10 rotate-[-1.5deg] rounded-[var(--radius-card)] border border-silver bg-white p-6 shadow-[var(--shadow-lift)]">
        <div className="flex items-start justify-between border-b border-silver pb-4">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ember">
              EN ISO 9606-1:2017
            </p>
            <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-onyx">
              Welder Qualification
            </h3>
          </div>
          <Badge tone="active">
            <span className="h-1.5 w-1.5 rounded-full bg-active" />
            Active
          </Badge>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[8px] bg-gradient-to-br from-steel/40 to-onyx/20" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
            <Field label="Welder" value="J. Morrison" />
            <Field label="UID" value="WLD-2024-042" />
            <Field label="Process" value="GMAW (135)" />
            <Field label="Position" value="PF" />
            <Field label="Joint" value="BW / Plate" />
            <Field label="Thickness" value="3–24 mm" />
          </div>
        </div>

        <div className="mt-4 rounded-[10px] bg-frost p-3">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
            Range of approval
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-charcoal">
            Thickness 3–24 mm · positions PA, PC, PF · material groups 1, 2 ·
            butt welds
          </p>
        </div>
      </div>

      {/* QR / verify card */}
      <div className="absolute -bottom-8 -right-4 z-20 w-44 rotate-[3deg] rounded-[var(--radius-card)] border border-silver bg-white p-4 shadow-[var(--shadow-lift)]">
        <div className="mx-auto w-24">
          <QrGlyph />
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-active-ink">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-display text-xs font-semibold">
            Verified on-site
          </span>
        </div>
      </div>

      {/* Behind: ID card sliver */}
      <div className="absolute -top-6 right-10 z-0 h-28 w-52 rotate-[5deg] rounded-[var(--radius-card)] border border-silver bg-onyx shadow-[var(--shadow-lift)]">
        <div className="flex h-full flex-col justify-between p-4">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-ember-soft">
            Welder ID Card
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-semibold text-white">
                W#247
              </p>
              <p className="text-[10px] text-steel">ISO 9606-1</p>
            </div>
            <div className="h-9 w-9 rounded-[5px] bg-white/90 p-1">
              <QrGlyph />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-steel">{label}</p>
      <p className="font-medium text-onyx">{value}</p>
    </div>
  );
}
