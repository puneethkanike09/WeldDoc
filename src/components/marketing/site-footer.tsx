import { DsButtonLink } from "@/components/marketing/ds-button";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-onyx text-white">
      {/* footer-newsletter block */}
      <div className="relative z-10 border-b border-white/10">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-mono-label text-coral">Qualification moves fast</p>
          <h2 className="text-section-heading mt-3 max-w-lg text-white">
            Stay ahead of every expiry deadline.
          </h2>
          <p className="text-caption mt-3 max-w-md text-muted-slate">
            Automatic reminders before 6-month, 2-year and revalidation
            deadlines — so no certificate lapses unnoticed.
          </p>
          <div className="mt-8">
            <DsButtonLink href="/login" variant="primary-on-dark">
              Get started
            </DsButtonLink>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 py-14">
        <div
          className="pointer-events-none select-none"
          aria-hidden
        >
          <span className="block font-ds-display text-[clamp(5rem,22vw,15rem)] font-bold uppercase leading-[0.85] tracking-tighter text-white/4">
            WeldDoc
          </span>
        </div>

        <p className="relative z-10 mt-8 text-micro text-muted-slate md:mt-10">
          © {new Date().getFullYear()} WeldDoc. Built for welding engineers,
          auditors and fabrication shops.
        </p>
      </div>
    </footer>
  );
}
