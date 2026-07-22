import Image from "next/image";
import { HeroProductDemo } from "@/components/marketing/hero-product-demo";
import {
  Check,
  QrCode,
  FileCheck2,
  IdCard,
  BellRing,
  Table2,
  PieChart,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";
import { DsButtonLink } from "@/components/marketing/ds-button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PricingSection } from "@/components/marketing/pricing-section";
import { QrGlyph } from "@/components/brand/qr-glyph";
import { NumberTicker } from "@/components/marketing/number-ticker";
import SoftAurora from "@/components/marketing/soft-aurora";
import { TrustMarquee } from "@/components/marketing/trust-marquee";
import { GEO_BRAND_ALIASES, GEO_DEFINITION, GEO_FAQS } from "@/lib/seo/geo-content";

const products = [
  {
    icon: QrCode,
    title: "Welder & operator registry",
    points: [
      "Permanent digital profiles",
      "Plant IDs (W#01, O#01)",
      "Live QR status link",
    ],
  },
  {
    icon: FileCheck2,
    title: "Welding certificate generation",
    points: [
      "Auto range of approval",
      "ISO-compliant certificate PDFs",
      "Upload original or signed copy",
    ],
  },
  {
    icon: IdCard,
    title: "ID card generation",
    points: ["Wallet-sized format", "Photo + scannable QR", "Print-ready PDF"],
  },
  {
    icon: BellRing,
    title: "Welder continuity tracking",
    points: [
      "Continuity & revalidation alerts",
      "Configurable lead windows",
      "Email digests",
    ],
  },
  {
    icon: Table2,
    title: "Welding record management",
    points: ["Filterable master list", "PDF export", "CSV export"],
  },
  {
    icon: PieChart,
    title: "Status dashboard",
    points: [
      "By process & joint type",
      "Customisable KPI widgets",
      "Expiry & overdue counts",
    ],
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
    body: "Range of approval computed. Print-ready certificate PDF issued.",
  },
  {
    n: "04",
    title: "Verify",
    body: "Site teams scan the QR and see live status. No login.",
  },
];

const comparison = [
  { label: "Purpose-built for welding qualifications", others: "Buried in multi-standard ERPs" },
  { label: "Standards-based range of approval", others: "Partial" },
  { label: "Auto range-of-approval engine", others: true },
  { label: "Instant QR on-site verification", others: "Partial" },
  { label: "Group qualification sessions", others: false },
  { label: "Built for the Indian market & price", others: false },
  { label: "Onboard in an afternoon", others: false },
];

export function Landing() {
  return (
    <main className="text-ink">
      {/* Hero — pt clears fixed nav (64px) + breathing room */}
      <section className="relative isolate overflow-hidden pb-[clamp(64px,10vw,120px)] pt-28 md:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100%,920px)] min-h-[520px] opacity-80 mask-[linear-gradient(to_bottom,black_65%,transparent)]"
        >
          <SoftAurora
            variant="light"
            className="h-full w-full"
            speed={0.48}
            scale={1.45}
            brightness={0.82}
            color1="#f0b56a"
            color2="#f5d4a0"
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
              Welder qualification software — finally under control.
            </h1>
            <p className="text-body-large mx-auto mt-8 max-w-[560px] text-ink">
              Welding documentation software for fabricators and QC teams —
              manage WPQ and WPQR records, generate certificates, track welder
              continuity and expiry, and verify qualifications with a QR scan.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <DsButtonLink href="/login">Get started</DsButtonLink>
              <DsButtonLink href="#features" variant="secondary">
                See features
              </DsButtonLink>
            </div>
          </div>

          <div className="hidden md:block">
            <HeroProductDemo />
          </div>
        </div>
      </section>

      {/* Trust strip — social proof early */}
      <section className="overflow-x-clip py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-caption text-center text-muted-slate">
            Trusted across fabrication industries
          </p>
        </div>
        <TrustMarquee />
      </section>

      {/* GEO — answer-first definition for AI / answer engines */}
      <section id="geo-definition" className="border-y border-hairline bg-soft-stone py-14">
        <div className="mx-auto max-w-[800px] px-6 text-center">
          <p className="text-mono-label text-slate">What is Weld.Doc?</p>
          <p className="text-body-large mt-4 text-ink">{GEO_DEFINITION}</p>
          <p id="brand-aliases" className="text-body mt-4 text-slate">
            {GEO_BRAND_ALIASES}
          </p>
        </div>
      </section>

      {/* Product cards — bento grid on canvas */}
      <section id="features" className="section-y bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="text-section-heading max-w-[640px]">
            Everything you need to run qualifications
          </h2>
          <p className="text-body-large mt-5 max-w-[520px] text-slate">
            From registration and WPS/WPQ workflows through certificate
            generation to on-site QR verification — without a sprawling ERP.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(186px,auto)]">
            {products.map((p, i) => {
              const featured = i === 0;
              const span = [
                "sm:col-span-2 lg:col-span-2 lg:row-span-2",
                "sm:col-span-2 lg:col-span-2",
                "lg:col-span-1",
                "lg:col-span-1",
                "sm:col-span-2 lg:col-span-2",
                "sm:col-span-2 lg:col-span-2",
              ][i];
              return (
                <article
                  key={p.title}
                  className={`relative flex flex-col overflow-hidden rounded-lg p-7 ${span} ${featured ? "bg-deep-green text-white" : "bg-soft-stone"
                    }`}
                >
                  <p.icon
                    className={`h-5 w-5 ${featured ? "text-coral" : "text-ink"}`}
                    strokeWidth={1.5}
                  />
                  <h3
                    className={
                      featured
                        ? "mt-5 font-ds-display text-[26px] font-semibold leading-tight"
                        : "text-feature-heading mt-6"
                    }
                  >
                    {p.title}
                  </h3>
                  <ul
                    className={`mt-5 flex-1 space-y-2.5 border-t pt-5 ${featured ? "border-white/15" : "border-hairline"
                      }`}
                  >
                    {p.points.map((pt) => (
                      <li
                        key={pt}
                        className={`flex items-start gap-2 text-body ${featured ? "text-white/70" : "text-slate"
                          }`}
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-coral" : "text-ink"
                            }`}
                          strokeWidth={2}
                        />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  {featured && (
                    <div className="mt-6 flex items-center gap-3">
                      <Image
                        src="/api/qr/demo?style=light"
                        alt="Scan to open sample welder verification"
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 shrink-0"
                      />
                      <span className="text-micro text-white/50">
                        Scan → live qualification status
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
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
            {workflow.map((s, i) => (
              <article key={s.n} className="bg-deep-green p-8">
                <NumberTicker
                  value={Number(s.n)}
                  delayMs={i * 150}
                  className="block font-ds-display text-[56px] font-bold leading-none text-coral sm:text-[64px]"
                />
                <h3 className="text-feature-heading mt-5 text-white">
                  {s.title}
                </h3>
                <p className="text-body mt-3 text-white/60">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* QR verification spotlight */}
      <section id="verification" className="section-y bg-canvas">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-mono-label text-slate">On-site verification</p>
            <h2 className="text-section-heading mt-4">
              Scan the badge. See the truth.
            </h2>
            <p className="text-body-large mt-5 text-slate">
              Every welder and operator ID carries a QR code. Anyone on the shop
              floor can scan and instantly see qualified or not, for which
              processes, valid until when — no login required.
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
                      J. Morrison
                    </p>
                    <p className="text-caption mt-1 text-slate">WLD-2024-042</p>
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
              <div className="rounded-md bg-onyx p-5 text-white">
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

      {/* Compare — highlighted Weld.Doc column lifted over pale green */}
      <section id="compare" className="section-y overflow-x-clip bg-pale-green">
        <div className="mx-auto max-w-[940px] px-6">
          <div className="max-w-[640px]">
            <p className="text-mono-label text-brand-red">Why Weld.Doc</p>
            <h2 className="text-section-heading mt-4">Focused beats bloated</h2>
            <p className="text-body-large mt-5 text-slate">
              Broad enterprise welding platforms try to do everything. Weld.Doc
              stays focused on qualifications — faster to adopt for fabrication
              and QC teams.
            </p>
          </div>

          <div className="relative mt-14">
            {/* Lifted white card behind the Weld.Doc column */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-5 bottom-0 right-[100px] w-[100px] rounded-2xl bg-canvas shadow-(--shadow-lift) sm:right-[150px] sm:w-[150px]"
            />

            <div className="relative z-10 min-w-0">
              {/* Header */}
              <div className="flex items-end">
                <span className="min-w-0 flex-1 border-b border-deep-green/15 pb-4 text-mono-label text-slate">
                  Capability
                </span>
                <span className="w-[100px] shrink-0 pb-4 text-center font-ds-display text-[15px] font-semibold text-brand-red sm:w-[150px]">
                  Weld.Doc
                </span>
                <span className="w-[100px] shrink-0 border-b border-deep-green/15 pb-4 text-center text-caption text-muted-slate sm:w-[150px]">
                  Others
                </span>
              </div>

              {/* Rows */}
              {comparison.map((row, i) => (
                <div key={row.label} className="flex min-w-0 items-center">
                  <span
                    className={`min-w-0 flex-1 py-5 text-body text-ink ${i < comparison.length - 1
                      ? "border-b border-deep-green/10"
                      : ""
                      }`}
                  >
                    {row.label}
                  </span>
                  <span className="flex w-[100px] shrink-0 justify-center py-5 sm:w-[150px]">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-red">
                      <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </span>
                  </span>
                  <span
                    className={`flex w-[100px] shrink-0 items-center justify-center px-2 py-5 text-center sm:w-[150px] ${i < comparison.length - 1
                      ? "border-b border-deep-green/10"
                      : ""
                      }`}
                  >
                    {row.others === true ? (
                      <Check className="h-4 w-4 text-muted-slate" strokeWidth={2} />
                    ) : row.others === false ? (
                      <X className="h-4 w-4 text-muted-slate/50" strokeWidth={2} />
                    ) : (
                      <span className="text-micro leading-snug text-slate">
                        {row.others}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ — after pricing; answers remain in DOM for SEO/GEO + FAQPage JSON-LD */}
      <section id="faq" className="section-y bg-soft-stone pb-32">
        <div className="mx-auto max-w-[800px] px-6">
          <p className="text-mono-label text-slate">FAQ</p>
          <h2 className="text-section-heading mt-4">
            Common questions
          </h2>
          <p className="text-body-large mt-5 text-slate">
            Straight answers for welding coordinators, QA/QC, and compliance
            teams evaluating Weld.Doc.
          </p>
          <div className="mt-12">
            <FaqAccordion items={GEO_FAQS} />
          </div>
        </div>
      </section>
    </main>
  );
}
