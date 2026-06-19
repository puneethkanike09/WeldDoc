import Image from "next/image";
import {
  Check,
  Minus,
  QrCode,
  FileCheck2,
  IdCard,
  BellRing,
  Table2,
  PieChart,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { DsButtonLink } from "@/components/marketing/ds-button";
import { QrGlyph } from "@/components/brand/qr-glyph";
import SoftAurora from "@/components/marketing/soft-aurora";
import { TrustMarquee } from "@/components/marketing/trust-marquee";

const products = [
  {
    icon: QrCode,
    title: "Welder registry + QR",
    points: ["Permanent digital profile", "Unique UID per welder", "Live QR status link"],
  },
  {
    icon: FileCheck2,
    title: "Certificate generation",
    points: ["EN ISO 9606-1 format", "Auto range of approval", "Stamp & signature applied"],
  },
  {
    icon: IdCard,
    title: "ID card generation",
    points: ["Wallet-sized format", "Photo + scannable QR", "Print-ready PDF"],
  },
  {
    icon: BellRing,
    title: "Expiry alerts",
    points: ["6-month continuity", "2-year revalidation", "Email digests"],
  },
  {
    icon: Table2,
    title: "Master list",
    points: ["Filterable register", "PDF export", "Excel export"],
  },
  {
    icon: PieChart,
    title: "Status dashboard",
    points: ["By process & joint type", "Category-gap flags", "Expiry widgets"],
  },
];

const workflow = [
  {
    n: "01",
    title: "Plan",
    body: "Capture standard, process, material group and test parameters.",
  },
  {
    n: "02",
    title: "Test & NDT/DT",
    body: "Record the test piece. RT/UT for butt welds, fracture for fillet.",
  },
  {
    n: "03",
    title: "Certify",
    body: "Range of approval computed. Stamped certificate generated.",
  },
  {
    n: "04",
    title: "Verify",
    body: "Auditors scan the QR and see live status. No login.",
  },
];

const comparison = [
  { label: "EN ISO 9606-1, done simply", others: "Buried in multi-standard ERPs" },
  { label: "Auto range-of-approval engine", others: true },
  { label: "Instant QR auditor verification", others: "Partial" },
  { label: "Batch qualification report (BW + FW)", others: false },
  { label: "Built for the Indian market & price", others: false },
  { label: "Onboard in an afternoon", others: false },
];

export function Landing() {
  return (
    <main className="font-ds-display text-ink">
      {/* Hero — monumental type + split media cards over soft aurora */}
      <section className="section-y relative isolate overflow-hidden bg-canvas pt-28 sm:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80%] opacity-60 mask-[linear-gradient(to_bottom,black_45%,transparent)]"
        >
          <SoftAurora
            variant="light"
            className="h-full w-full"
            speed={0.48}
            scale={1.45}
            brightness={0.82}
            color1="#ff8a6e"
            color2="#fcab79"
            bandHeight={0.58}
            bandSpread={1.05}
            noiseFrequency={2.8}
            colorSpeed={0.65}
            enableMouseInteraction={false}
          />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6">
          <div className="mx-auto max-w-[800px] text-center">
            <h1 className="text-hero-cohere text-balance">
              Welder qualification, finally under control.
            </h1>
            <p className="text-body-large mx-auto mt-8 max-w-[560px] text-ink">
              Register welders, auto-calculate the range of approval, generate
              stamped certificates and let auditors verify status with a single
              QR scan.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <DsButtonLink href="/login">Get started</DsButtonLink>
              <DsButtonLink href="#features" variant="secondary">
                Explore products
              </DsButtonLink>
            </div>
          </div>

          {/* Split hero media */}
          <div className="mt-20 grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:gap-6">
            <div className="relative aspect-16/10 overflow-hidden rounded-lg bg-soft-stone lg:aspect-auto lg:min-h-[420px]">
              <Image
                src="/images/hero-banner.jpg"
                alt="Welder at work in a fabrication workshop"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-soft-stone lg:aspect-auto lg:min-h-[420px]">
              <Image
                src="/images/card-welder.jpg"
                alt="Welder in a fabrication workshop"
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip — scroll-velocity marquee on light canvas */}
      <section className="pb-24 pt-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-caption text-center text-muted-slate">
            Trusted across fabrication industries
          </p>
        </div>
        <TrustMarquee />
      </section>

      {/* Product cards — soft stone, 3-column */}
      <section id="features" className="section-y bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="text-section-heading max-w-[640px]">
            Six tools for the ISO 9606-1 lifecycle
          </h2>
          <p className="text-body-large mt-5 max-w-[520px] text-slate">
            A focused toolkit — not a sprawling ERP — from registration to
            on-site verification.
          </p>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article
                key={p.title}
                className="flex flex-col rounded-sm bg-soft-stone p-8"
              >
                <p.icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
                <h3 className="text-feature-heading mt-6">{p.title}</h3>
                <ul className="mt-5 flex-1 space-y-2.5 border-t border-hairline pt-5">
                  {p.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2 text-body text-slate"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-ink"
                        strokeWidth={2}
                      />
                      {pt}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dark feature band — deep green */}
      <section id="workflow" className="section-y bg-deep-green text-white">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-mono-label text-white/50">Workflow</p>
          <h2 className="text-section-heading mt-4 max-w-[640px]">
            Plan → Test → Certify → Verify
          </h2>
          <p className="text-body-large mt-5 max-w-[520px] text-white/65">
            A gated four-step process that mirrors how a real qualification
            happens. Each step unlocks the next.
          </p>
          <div className="mt-16 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((s) => (
              <article key={s.n} className="bg-deep-green p-8">
                <span className="text-mono-label text-coral">{s.n}</span>
                <h3 className="text-feature-heading mt-4 text-white">
                  {s.title}
                </h3>
                <p className="text-body mt-3 text-white/60">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Capability + structural verification mock — white canvas */}
      <section className="section-y bg-canvas">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-mono-label text-slate">On-site verification</p>
            <h2 className="text-section-heading mt-4">
              Scan the badge. See the truth.
            </h2>
            <p className="text-body-large mt-5 text-slate">
              Every welder ID carries a QR code. An auditor points their phone
              and instantly sees qualified or not, for which processes, valid
              until when — no login required.
            </p>
            <p className="mt-8">
              <DsButtonLink href="/login" variant="secondary">
                Start verifying
              </DsButtonLink>
            </p>
          </div>

          <div className="rounded-lg bg-soft-stone p-6 sm:p-8">
            <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
              {/* Welder ID badge */}
              <div className="rounded-md border border-hairline bg-canvas p-5">
                <p className="text-mono-label text-muted-slate">Welder ID</p>
                <div className="mt-4 flex items-center gap-4">
                  <QrGlyph className="h-16 w-16 shrink-0 border border-hairline" />
                  <div className="min-w-0">
                    <p className="text-feature-heading leading-tight">
                      D. Pradhan
                    </p>
                    <p className="text-caption mt-1 text-slate">WLD-2026-047</p>
                  </div>
                </div>
              </div>

              {/* Scan connector */}
              <div className="flex items-center justify-center py-1 sm:py-0">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-coral text-white">
                  <ScanLine className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>

              {/* Live status result */}
              <div className="rounded-md bg-primary p-5 text-white">
                <p className="text-mono-label text-white/50">Live status</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-active/30 px-2 py-1 text-micro text-[#b8e6bc]">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                    Qualified
                  </span>
                </div>
                <dl className="mt-4 space-y-2.5 border-t border-white/15 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-micro text-white/50">Process</dt>
                    <dd className="text-caption text-white/90">GMAW 135</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-micro text-white/50">Range</dt>
                    <dd className="text-caption text-white/90">PF · BW · 3–24 mm</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-micro text-white/50">Valid until</dt>
                    <dd className="text-caption text-white/90">14 Jun 2028</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research-table compare — pale green wash */}
      <section id="compare" className="section-y bg-pale-green">
        <div className="mx-auto max-w-[900px] px-6">
          <h2 className="text-section-heading">Focused beats bloated</h2>
          <p className="text-body-large mt-4 text-slate">
            WeldEye, WeldTrace and WeldNote are broad enterprise platforms. For
            a shop on ISO 9606-1, WeldDoc is faster and easier to adopt.
          </p>
          <div className="mt-12 border-t border-hairline">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-hairline py-3 sm:grid-cols-[1fr_80px_120px]">
              <span className="text-caption text-muted-slate">Capability</span>
              <span className="text-center text-caption text-muted-slate">
                WeldDoc
              </span>
              <span className="text-center text-caption text-muted-slate">
                Others
              </span>
            </div>
            {comparison.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-hairline py-5 sm:grid-cols-[1fr_80px_120px]"
              >
                <span className="text-body text-ink">{row.label}</span>
                <span className="flex justify-center">
                  <Check className="h-4 w-4 text-ink" strokeWidth={2.5} />
                </span>
                <span className="text-center text-caption text-slate">
                  {row.others === true ? (
                    <Check className="mx-auto h-4 w-4 text-muted-slate" />
                  ) : row.others === false ? (
                    <Minus className="mx-auto h-4 w-4 text-muted-slate" />
                  ) : (
                    row.others
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — contained dark card */}
      <section id="pricing" className="section-y bg-canvas pb-32">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="rounded-lg bg-dark-navy p-8 sm:p-12 lg:p-16">
            <div className="max-w-[520px]">
              <h2 className="text-section-heading text-white">
                Ready for your next audit?
              </h2>
              <p className="text-body-large mt-5 text-white/70">
                Set up your plant, register your first welders and issue a
                compliant certificate today.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <DsButtonLink href="/login" variant="primary-on-dark">
                  Get started
                </DsButtonLink>
                <DsButtonLink href="#features" variant="secondary-on-dark">
                  Explore features
                </DsButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
