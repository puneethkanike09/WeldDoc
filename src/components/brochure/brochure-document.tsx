import {
  BROCHURE_ABOUT,
  BROCHURE_CALLOUTS,
  BROCHURE_CHALLENGES,
  BROCHURE_FEATURES,
  BROCHURE_HEADLINE,
  BROCHURE_INDUSTRIES,
  BROCHURE_PERSONAS,
  BROCHURE_PROOF_STATS,
  BROCHURE_SCREENSHOTS,
  BROCHURE_SECURITY,
  BROCHURE_SOLUTIONS,
  BROCHURE_TAGLINE,
  BROCHURE_WORKFLOW,
  COMPARE_LEGEND,
  COMPETITOR_COLUMNS,
  COMPETITOR_ROWS,
  type CompareCell,
} from "@/lib/brochure/content";
import { getBrochureRegion, type BrochureRegion } from "@/lib/brochure/regions";
import { BrochureShot } from "@/components/brochure/brochure-shot";
import { BrochureWhatsAppQr } from "@/components/brochure/brochure-whatsapp-qr";

function CompareIcon({ value }: { value: CompareCell }) {
  if (value === "yes") {
    return (
      <svg className="brochure-icon brochure-icon-yes" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
        <path
          d="M4.5 8.2 6.9 10.8 11.5 5.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (value === "partial") {
    return (
      <svg className="brochure-icon brochure-icon-partial" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
        <path d="M4.5 8h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return <span className="brochure-icon-no">–</span>;
}

export function BrochureDocument({ region = "inr" }: { region?: BrochureRegion }) {
  const regional = getBrochureRegion(region);

  return (
    <div className="brochure-root">
      {/* Screen toolbar */}
      <div className="brochure-screen-toolbar">
        <span>Weld.Doc · Forge Steel brochure · {regional.editionLabel}</span>
        <div className="brochure-screen-actions">
          <a
            href={regional.pdfPath}
            download={regional.pdfDownloadName}
            className="brochure-btn brochure-btn-primary"
          >
            Download PDF
          </a>
          <span className="brochure-screen-hint">
            Regenerate: <code>{regional.pdfScriptHint}</code>
          </span>
        </div>
      </div>

      {/* ════════════════════ PAGE 1 ════════════════════ */}
      <section className="brochure-page">

        {/* Full-bleed photo hero — 80mm */}
        <div className="brochure-hero-photo">
          <div className="brochure-hero-content">
            <div className="brochure-hero-top">
              <BrochureShot
                src="/images/welddoc-logo.png"
                alt="Weld.Doc"
                className="brochure-logo-img"
              />
              <div className="brochure-cover-pills">
                {BROCHURE_INDUSTRIES.map((industry) => (
                  <span key={industry} className="brochure-pill-on-dark">
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            <div className="brochure-hero-bottom">
              <div>
                <h1 className="brochure-hero-headline">{BROCHURE_HEADLINE}</h1>
                <p className="brochure-hero-sub">{BROCHURE_TAGLINE}</p>
              </div>
              <figure className="brochure-hero-inset">
                <BrochureWhatsAppQr whatsapp={regional.whatsapp} />
                <figcaption className="brochure-hero-inset-label">
                  {regional.whatsapp.label}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Page 1 body */}
        <div className="brochure-body-pad">

          {/* About + Challenge/Solution */}
          <div className="brochure-split brochure-mt">
            <div>
              <h2 className="brochure-headline">
                Welder qualification,<br />finally under control
              </h2>
              <p className="brochure-lead">{BROCHURE_ABOUT}</p>
              <ul className="brochure-callouts brochure-mt-tight">
                {BROCHURE_CALLOUTS.map((callout) => (
                  <li key={callout.text} className="brochure-callout">
                    <span className="brochure-callout-dot" aria-hidden />
                    <span>{callout.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="brochure-problem-solution">
              <div className="brochure-card brochure-card-challenge">
                <p className="brochure-kicker">The challenge</p>
                <ul className="brochure-list">
                  {BROCHURE_CHALLENGES.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="brochure-card brochure-card-solution">
                <p className="brochure-kicker">Our solution</p>
                <ul className="brochure-list">
                  {BROCHURE_SOLUTIONS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* App screenshots strip — flex:1 fills remaining space */}
          <div className="brochure-screenshots brochure-mt-tight">
            <p className="brochure-kicker">See it in action</p>
            <div className="brochure-screenshots-grid">
              {BROCHURE_SCREENSHOTS.map((shot) => (
                <div key={shot.src} className="brochure-screenshot-item">
                  <BrochureShot
                    src={shot.src}
                    alt={shot.alt}
                    className="brochure-screenshot-img"
                  />
                  <span className="brochure-screenshot-label">{shot.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key features */}
          <div className="brochure-mt-tight">
            <p className="brochure-kicker">Key features</p>
            <div className="brochure-feature-grid">
              {BROCHURE_FEATURES.map((feature) => (
                <div key={feature.title} className="brochure-feature">
                  <p className="brochure-feature-title">{feature.title}</p>
                  <p className="brochure-feature-detail">{feature.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="brochure-mt-tight">
            <p className="brochure-kicker">How it works</p>
            <div className="brochure-workflow">
              {BROCHURE_WORKFLOW.map((step, index) => (
                <div key={step} className="brochure-workflow-step">
                  <span className="brochure-workflow-n">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="brochure-workflow-text">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="brochure-page-footer">
            <span className="brochure-footnote">
              Standards: EN ISO 9606-1 · ISO 14732 · ASME IX &amp; AWS D1.1 on roadmap
            </span>
            <span className="brochure-page-num">1 / 2</span>
          </footer>
        </div>
      </section>

      {/* ════════════════════ PAGE 2 ════════════════════ */}
      <section className="brochure-page">

        {/* Proof stats — full-width navy */}
        <div className="brochure-proof-bar">
          {BROCHURE_PROOF_STATS.map((stat) => (
            <div key={stat.value} className="brochure-proof-stat">
              <p className="brochure-proof-value">{stat.value}</p>
              <p className="brochure-proof-label">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Page 2 header band */}
        <header className="brochure-page-header">
          <p className="brochure-kicker">Why Weld.Doc</p>
          <h2 className="brochure-headline brochure-headline-sm">
            Built for qualification. Priced for your shop.
          </h2>
          <p className="brochure-lead brochure-lead-sm">
            Big platforms charge for weld mapping, ERP connectors and features most shops never
            touch. Weld.Doc does one thing really well — keeps your welders qualified and your
            records compliance-ready. That's it. Honest pricing, fast setup, no training course needed.
          </p>
        </header>

        {/* Page 2 body */}
        <div className="brochure-body-pad">

          {/* Who uses Weld.Doc — 3 persona cards */}
          <div className="brochure-mt-tight">
            <p className="brochure-kicker">Who uses Weld.Doc</p>
            <div className="brochure-personas">
              {BROCHURE_PERSONAS.map((persona) => (
                <div key={persona.role} className="brochure-persona">
                  <p className="brochure-persona-role">{persona.role}</p>
                  <ul className="brochure-list brochure-mt-tight">
                    {persona.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div className="brochure-compare brochure-mt-tight">
            <table className="brochure-compare-table">
              <thead>
                <tr>
                  <th className="col-feature">Capability</th>
                  {COMPETITOR_COLUMNS.map((col) => (
                    <th key={col} className={col === "Weld.Doc" ? "col-welddoc" : undefined}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="col-feature">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.label}-${COMPETITOR_COLUMNS[index]}`}
                        className={COMPETITOR_COLUMNS[index] === "Weld.Doc" ? "col-welddoc" : undefined}
                      >
                        <CompareIcon value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="brochure-legend">
              {COMPARE_LEGEND.map((item) => (
                <span key={item.key} className="brochure-legend-item">
                  <CompareIcon value={item.key} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Security + Pricing */}
          <div className="brochure-bottom-grid brochure-mt-tight">
            <div className="brochure-card-navy">
              <p className="brochure-kicker">Security &amp; data</p>
              <ul className="brochure-list">
                {BROCHURE_SECURITY.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="brochure-kicker">Pricing</p>
              <div className="brochure-pricing-grid">
                {regional.pricing.map((plan) => (
                  <div
                    key={plan.name}
                    className={`brochure-price${plan.featured ? " brochure-price-featured" : ""}`}
                  >
                    {plan.featured && (
                      <span className="brochure-price-badge">Most popular</span>
                    )}
                    <p className="brochure-price-name">{plan.name}</p>
                    <p className="brochure-price-amount">{plan.price}</p>
                    <p className="brochure-price-welders">{plan.welders}</p>
                    <p className="brochure-price-period">{plan.period}</p>
                    <p className="brochure-price-note">{plan.note}</p>
                    <ul className="brochure-price-features">
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact footer */}
        <footer className="brochure-contact-bar">
          <div>
            <BrochureShot
              src="/images/welddoc-logo.png"
              alt="Weld.Doc"
              className="brochure-footer-logo"
            />
            <p className="brochure-contact-line">{regional.contact.phone}</p>
          </div>
          <figure className="brochure-hero-inset brochure-footer-qr">
            <BrochureWhatsAppQr whatsapp={regional.whatsapp} />
            <figcaption className="brochure-hero-inset-label">
              {regional.whatsapp.label}
            </figcaption>
          </figure>
          <div className="brochure-contact-cta">
            <p className="brochure-contact-cta-text">
              Start free · 3 welders · 1 month · no credit card
            </p>
            <p className="brochure-page-num">2 / 2</p>
          </div>
        </footer>
      </section>
    </div>
  );
}
