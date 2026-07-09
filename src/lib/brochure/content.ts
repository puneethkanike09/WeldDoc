export type CompareCell = "yes" | "partial" | "no";

export {
  type BrochurePricingPlan,
  type BrochureRegion,
  type BrochureRegionalConfig,
  BROCHURE_REGIONS,
  getBrochureRegion,
  brochureWhatsAppUrl,
} from "@/lib/brochure/regions";

import { getBrochureRegion } from "@/lib/brochure/regions";

const inr = getBrochureRegion("inr");

export const BROCHURE_CONTACT = inr.contact;
export const BROCHURE_WHATSAPP = inr.whatsapp;
export const BROCHURE_PRICING = inr.pricing;
export const BROCHURE_PDF_PATH = inr.pdfPath;

export const BROCHURE_TAGLINE =
  "Digital Welding Qualification & Compliance Management";

export const BROCHURE_HEADLINE =
  "Are you ready to digitalize your welding qualification?";

export const BROCHURE_HERO_PHOTO = "/images/welding-hero.jpg";

export const BROCHURE_PROOF_STATS = [
  { value: "3 min",   label: "Certificate generated"  },
  { value: "30 sec",  label: "QR audit verify"        },
  { value: "0 paper", label: "Complete digital trail" },
] as const;

export const BROCHURE_INDUSTRIES = [
  "Oil & Gas",
  "Construction",
  "Manufacturing",
  "Shipbuilding",
  "Pressure vessels",
  "Structural steel",
] as const;

export const BROCHURE_ABOUT =
  "Most welding shops run on a mix of spreadsheets, paper folders and memory. That works until the inspection  arrives. Weld.Doc replaces that chaos with one simple system: every welder registered, every certificate generated, every expiry tracked. No folders. No last-minute panic. Just clean records, ready when you need them.";

export const BROCHURE_CHALLENGES = [
  "Paper certificates that go missing before an audit",
  "Revalidation deadlines discovered only after they pass",
  "No way to prove qualification without being in the office",
] as const;

export const BROCHURE_SOLUTIONS = [
  "One registry — every welder, every document, always current",
  "Certificates in 3 minutes, not 3 days — ISO-compliant PDFs",
  "QR link lets auditors verify on the spot. No account needed.",
] as const;

export const BROCHURE_FEATURES = [
  { title: "Welder & operator registry", detail: "Photo, plant ID, QR profile" },
  { title: "Qualification wizard", detail: "ISO 9606-1 & ISO 14732 guided entry" },
  { title: "Certificate generation", detail: "Auto range of approval, stamped PDF" },
  { title: "ID cards", detail: "Wallet-sized, print-ready with QR code" },
  { title: "Test result management", detail: "NDT reports, pass/fail, attachments" },
  { title: "Document storage", detail: "Signed certs, legacy uploads, reports" },
  { title: "Expiry tracking", detail: "6-month, 2-year & revalidation rules" },
  { title: "Search & master list", detail: "Filter by process, status; PDF/Excel export" },
  { title: "Dashboard & reports", detail: "KPIs, charts, qualification gaps" },
  { title: "Role-based access", detail: "Organisation-scoped team permissions" },
] as const;

export const BROCHURE_WORKFLOW = [
  "Add the welder once",
  "Log the test results",
  "Attach test reports",
  "Range auto-calculated",
  "Certificate is ready",
  "Expiry tracked for you",
] as const;

export const BROCHURE_CALLOUTS = [
  { text: "Know who's expiring before the auditor does" },
  { text: "Full history — qualifications, docs, approval range" },
  { text: "Scan the QR code. Qualification confirmed in seconds." },
  { text: "Works on phone, tablet or desktop — no installation" },
] as const;

/** App screenshots shown in the strip on page 1 */
export const BROCHURE_SCREENSHOTS = [
  {
    src: "/images/1.png",
    alt: "Weld.Doc welder master list with status filters",
    label: "Master list & search",
  },
  {
    src: "/images/3.png",
    alt: "Weld.Doc qualification entry form with range-of-approval",
    label: "Qualification entry",
  },
] as const;

export const BROCHURE_PERSONAS = [
  {
    role: "Welding Coordinator",
    description: "You do the real work — and most of it is paperwork. Weld.Doc cuts that in half.",
    points: [
      "Add a welder and log test results in under 5 minutes",
      "Certificate is generated automatically — no typing, no formatting",
      "Get reminded before a qualification expires, not after",
    ],
  },
  {
    role: "Quality Manager",
    description: "You're responsible when the auditor shows up. Weld.Doc means you're always ready.",
    points: [
      "Full qualification records with supporting documents, one click",
      "Export master lists for client or third-party audits instantly",
      "Every change logged — complete audit trail, always",
    ],
  },
  {
    role: "Plant Owner / Director",
    description: "You need to know compliance status — not read a 50-page spreadsheet to find it.",
    points: [
      "Dashboard shows active, expiring and expired at a glance",
      "No audit surprises — team is always working from live data",
      "Manage multiple sites from one login",
    ],
  },
] as const;

export const BROCHURE_BENEFITS = [
  "Hours saved per qualification",
  "No more paper chasing",
  "Audit-ready every day",
  "All branches, one login",
  "Audits that finish fast",
] as const;

export const BROCHURE_SECURITY = [
  "Secure cloud hosting with encrypted HTTPS",
  "Organisation-scoped data isolation",
  "Role-based permissions per team member",
  "Automatic backups via cloud infrastructure",
  "Full audit log of every data change",
] as const;

export const COMPETITOR_COLUMNS = [
  "Weld.Doc",
  "WeldTrace",
  "WeldNote",
  "WeldEye",
  "weldassistant",
  "WeldStack",
] as const;

export const COMPETITOR_ROWS: {
  label: string;
  values: CompareCell[];
}[] = [
  {
    label: "ISO 9606-1 welder qualifications",
    values: ["yes", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    label: "ISO 14732 operator qualifications",
    values: ["yes", "partial", "no", "yes", "yes", "no"],
  },
  {
    label: "ASME IX / AWS D1.1 support",
    values: ["partial", "yes", "partial", "yes", "yes", "partial"],
  },
  {
    label: "Auto range-of-approval engine",
    values: ["yes", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    label: "Certificate & ID card PDF",
    values: ["yes", "partial", "yes", "partial", "partial", "partial"],
  },
  {
    label: "Public QR verification (no login)",
    values: ["yes", "partial", "no", "no", "no", "yes"],
  },
  {
    label: "Expiry & continuity alerts",
    values: ["yes", "yes", "yes", "yes", "yes", "partial"],
  },
  {
    label: "Bulk import of legacy records",
    values: ["yes", "yes", "partial", "partial", "partial", "partial"],
  },
  {
    label: "WPS / PQR authoring",
    values: ["no", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    label: "Project weld traceability / MDR",
    values: ["no", "yes", "partial", "yes", "no", "partial"],
  },
  {
    label: "Fast setup — focused UX",
    values: ["yes", "partial", "partial", "partial", "partial", "partial"],
  },
  {
    label: "Affordable for small shops",
    values: ["yes", "partial", "no", "no", "partial", "yes"],
  },
];

export const COMPARE_LEGEND: { key: CompareCell; label: string }[] = [
  { key: "yes", label: "Included" },
  { key: "partial", label: "Partial / planned" },
  { key: "no", label: "Not included" },
];
