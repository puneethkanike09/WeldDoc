import {
  BROCHURE_ABOUT,
  BROCHURE_BENEFITS,
  BROCHURE_CALLOUTS,
  BROCHURE_CHALLENGES,
  BROCHURE_CONTACT,
  BROCHURE_FEATURES,
  BROCHURE_HERO,
  BROCHURE_INDUSTRIES,
  BROCHURE_INSET,
  BROCHURE_PDF_PATH,
  BROCHURE_PRICING,
  BROCHURE_SECURITY,
  BROCHURE_SOLUTIONS,
  BROCHURE_TAGLINE,
  BROCHURE_WORKFLOW,
  COMPARE_LEGEND,
  COMPETITOR_COLUMNS,
  COMPETITOR_ROWS,
  type CompareCell,
} from "@/lib/brochure/content";
import { BrochureShot } from "@/components/brochure/brochure-shot";

function CompareIcon({ value }: { value: CompareCell }) {
  if (value === "yes") {
    return (
      <svg className="brochure-icon brochure-icon-yes" viewBox="0 0 16 16" aria-hidden>
        <path
          d="M3.5 8.2 6.4 11 12.5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (value === "partial") {
    return (
      <svg className="brochure-icon brochure-icon-partial" viewBox="0 0 16 16" aria-hidden>
        <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return <span className="brochure-icon-no">—</span>;
}

export function BrochureDocument() {
  return (
    <div className="brochure-root">
      <div className="brochure-screen-toolbar">
        <span>Brochure preview</span>
        <div className="brochure-screen-actions">
          <a
            href={BROCHURE_PDF_PATH}
            download="WeldDoc-brochure.pdf"
            className="brochure-btn brochure-btn-primary"
          >
            Download PDF
          </a>
          <span className="brochure-screen-hint">
            Regenerate: <code>npm run brochure:pdf</code>
          </span>
        </div>
      </div>

      {/* ── Page 1 ── */}
      <section className="brochure-page">
        <header className="brochure-cover">
          <div className="brochure-cover-top">
            <div className="brochure-logo">
              <span className="weld">Weld.</span>
              <span className="doc">Doc</span>
            </div>
            <p className="brochure-cover-tagline">{BROCHURE_TAGLINE}</p>
          </div>
          <div className="brochure-cover-pills">
            {BROCHURE_INDUSTRIES.map((industry) => (
              <span key={industry} className="brochure-pill brochure-pill-on-dark">
                {industry}
              </span>
            ))}
          </div>
        </header>

        <div className="brochure-split brochure-mt">
          <article className="brochure-about">
            <h2 className="brochure-headline">
              Welder qualification, finally under control
            </h2>
            <p className="brochure-lead">{BROCHURE_ABOUT}</p>
          </article>

          <div className="brochure-problem-solution">
            <div className="brochure-card">
              <p className="brochure-kicker">The challenge</p>
              <ul className="brochure-list">
                {BROCHURE_CHALLENGES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="brochure-card brochure-card-accent">
              <p className="brochure-kicker">Our solution</p>
              <ul className="brochure-list">
                {BROCHURE_SOLUTIONS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="brochure-hero-block brochure-mt">
          <p className="brochure-kicker brochure-kicker-inline">{BROCHURE_HERO.label}</p>
          <div className="brochure-hero-stage">
            <BrochureShot
              src={BROCHURE_HERO.src}
              alt={BROCHURE_HERO.alt}
              className="brochure-hero-img"
            />
            <figure className="brochure-hero-inset">
              <BrochureShot
                src={BROCHURE_INSET.src}
                alt={BROCHURE_INSET.alt}
                className="brochure-hero-inset-img"
              />
              <figcaption className="brochure-hero-inset-label">
                {BROCHURE_INSET.label}
              </figcaption>
            </figure>
          </div>
          <ul className="brochure-callouts">
            {BROCHURE_CALLOUTS.map((callout) => (
              <li key={callout.text} className="brochure-callout">
                <span className="brochure-callout-dot" aria-hidden />
                <span className="brochure-callout-text">{callout.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="brochure-mt brochure-mt-tight">
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

        <div className="brochure-mt brochure-mt-tight">
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
            Standards: EN ISO 9606-1 · ISO 14732 · ASME IX & AWS D1.1 on roadmap
          </span>
          <span className="brochure-page-num">1 / 2</span>
        </footer>
      </section>

      {/* ── Page 2 ── */}
      <section className="brochure-page">
        <header className="brochure-page-header">
          <p className="brochure-kicker">Why WeldDoc</p>
          <h2 className="brochure-headline brochure-headline-sm">
            Focused beats bloated
          </h2>
          <p className="brochure-lead brochure-lead-sm">
            Enterprise platforms bundle weld mapping and ERP workflows. WeldDoc
            specialises in qualification management — faster setup, clearer UX, and
            pricing that works for Indian fabrication shops.
          </p>
        </header>

        <div className="brochure-compare brochure-mt-tight">
          <table className="brochure-compare-table">
            <thead>
              <tr>
                <th className="col-feature">Capability</th>
                {COMPETITOR_COLUMNS.map((col) => (
                  <th key={col} className={col === "WeldDoc" ? "col-welddoc" : undefined}>
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
                      className={
                        COMPETITOR_COLUMNS[index] === "WeldDoc" ? "col-welddoc" : undefined
                      }
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

        <div className="brochure-benefits-row brochure-mt-tight">
          {BROCHURE_BENEFITS.map((benefit) => (
            <div key={benefit} className="brochure-benefit-chip">
              {benefit}
            </div>
          ))}
        </div>

        <div className="brochure-bottom-grid brochure-mt-tight">
          <div className="brochure-card">
            <p className="brochure-kicker">Security & data</p>
            <ul className="brochure-list">
              {BROCHURE_SECURITY.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="brochure-pricing-block">
            <p className="brochure-kicker">Pricing</p>
            <div className="brochure-pricing-grid">
              {BROCHURE_PRICING.map((plan) => (
                <div
                  key={plan.name}
                  className={`brochure-price${plan.featured ? " brochure-price-featured" : ""}`}
                >
                  {plan.featured ? (
                    <span className="brochure-price-badge">Popular</span>
                  ) : null}
                  <p className="brochure-price-name">{plan.name}</p>
                  <p className="brochure-price-amount">{plan.price}</p>
                  <p className="brochure-price-welders">{plan.welders}</p>
                  <p className="brochure-price-period">{plan.period}</p>
                  <p className="brochure-price-note">{plan.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="brochure-contact-bar">
          <div>
            <p className="brochure-contact-brand">{BROCHURE_CONTACT.company}</p>
            <p className="brochure-contact-line">{BROCHURE_CONTACT.website}</p>
            <p className="brochure-contact-line">{BROCHURE_CONTACT.email}</p>
            <p className="brochure-contact-line">{BROCHURE_CONTACT.phone}</p>
          </div>
          <div className="brochure-contact-cta">
            <p className="brochure-contact-cta-text">Start free · 3 welders · 1 month</p>
            <p className="brochure-page-num">2 / 2</p>
          </div>
        </footer>
      </section>
    </div>
  );
}
