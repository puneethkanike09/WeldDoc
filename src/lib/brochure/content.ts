export type CompareCell = "yes" | "partial" | "no";

export const BROCHURE_CONTACT = {
  website: "https://welddoc.in",
  email: "hello@welddoc.in",
  phone: "+91 — contact sales",
  company: "WeldDoc",
} as const;

export const BROCHURE_TAGLINE =
  "Digital Welding Qualification & Compliance Management";

export const BROCHURE_INDUSTRIES = [
  "Oil & Gas",
  "Construction",
  "Manufacturing",
  "Shipbuilding",
  "Pressure vessels",
  "Structural steel",
] as const;

export const BROCHURE_ABOUT =
  "WeldDoc digitises welder and operator qualification — registry, certificates, ID cards, QR verification and expiry alerts. ISO-standard compliance without enterprise ERP complexity.";

export const BROCHURE_CHALLENGES = [
  "Manual records in spreadsheets and paper folders",
  "Missed continuity and revalidation deadlines",
  "Slow audits — lost or outdated certificates",
] as const;

export const BROCHURE_SOLUTIONS = [
  "One registry for welders and operators",
  "Certificates and ID cards in minutes",
  "Expiry alerts and QR auditor verification",
] as const;

export const BROCHURE_FEATURES = [
  { title: "Welder & operator registry", detail: "UID, photo, plant ID, QR profile" },
  { title: "Qualification wizard", detail: "ISO 9606-1 & ISO 14732 guided entry" },
  { title: "Certificate generation", detail: "Auto range of approval, stamped PDF" },
  { title: "ID cards", detail: "Wallet-sized, print-ready with QR" },
  { title: "Test result management", detail: "NDT reports, pass/fail, attachments" },
  { title: "Document storage", detail: "Signed certs, legacy uploads, reports" },
  { title: "Expiry tracking", detail: "6-month, 2-year & revalidation rules" },
  { title: "Search & master list", detail: "Filter by process, status; PDF/Excel export" },
  { title: "Dashboard & reports", detail: "KPIs, charts, qualification gaps" },
  { title: "Role-based access", detail: "Organisation-scoped team permissions" },
] as const;

export const BROCHURE_WORKFLOW = [
  "Register welder",
  "Enter test details",
  "Upload reports",
  "Auto approval range",
  "Generate certificate",
  "Track renewals",
] as const;

/** Hero + inset screenshots — edit paths here, then run `npm run brochure:pdf` */
export const BROCHURE_HERO = {
  src: "/images/2.png",
  alt: "WeldDoc dashboard with welder KPIs, expiry status and qualification charts",
  label: "Dashboard & analytics",
} as const;

export const BROCHURE_INSET = {
  src: "/images/4.png",
  alt: "Welder profile with qualification range, documents and QR code",
  label: "Drill down to each welder",
} as const;

export const BROCHURE_CALLOUTS = [
  { text: "See compliance status at a glance", audience: "Owner" },
  { text: "Flag overdue before your next audit", audience: "Owner" },
  { text: "Full profile, approval range & documents", audience: "Coordinator" },
  { text: "QR verify · certificate · ID card · ISO 9606-1", audience: "Both" },
] as const;

export const BROCHURE_PDF_PATH = "/brochure/welddoc-brochure.pdf";

export const BROCHURE_BENEFITS = [
  "Save hours on every qualification",
  "Eliminate paper chasing",
  "Stay audit-ready year-round",
  "Centralise records across branches",
  "Faster client & third-party audits",
] as const;

export const BROCHURE_SECURITY = [
  "Secure cloud hosting with encrypted HTTPS",
  "Organisation-scoped data isolation",
  "Role-based permissions per team member",
  "Automatic backups via cloud infrastructure",
] as const;

export const BROCHURE_PRICING: readonly {
  name: string;
  welders: string;
  period: string;
  price: string;
  note: string;
  featured?: boolean;
}[] = [
  {
    name: "Starter",
    welders: "Up to 3 welders / operators",
    period: "Free for 1 month",
    price: "₹0",
    note: "Full features · no credit card",
  },
  {
    name: "Growth",
    welders: "Up to 20 welders / operators",
    period: "Per year",
    price: "₹24,999",
    note: "Best for fabrication shops",
    featured: true,
  },
  {
    name: "Enterprise",
    welders: "Unlimited welders / operators",
    period: "Per year",
    price: "Custom",
    note: "Multi-site · bulk import · priority support",
  },
];

export const COMPETITOR_COLUMNS = [
  "WeldDoc",
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
