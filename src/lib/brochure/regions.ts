const BROCHURE_PHONE_NUMBER = "9099601946";

export type BrochureRegion = "inr" | "eur";

export type BrochurePricingPlan = {
  name: string;
  welders: string;
  period: string;
  price: string;
  note: string;
  features: readonly string[];
  featured?: boolean;
};

export type BrochureRegionalConfig = {
  region: BrochureRegion;
  editionLabel: string;
  pdfPath: string;
  pdfDownloadName: string;
  pdfScriptHint: string;
  contact: {
    website: string;
    email: string;
    phone: string;
    company: string;
  };
  whatsapp: {
    phone: string;
    message: string;
    label: string;
  };
  pricing: readonly BrochurePricingPlan[];
};

const sharedContact = {
  website: "https://welddoc.in",
  email: "hello@welddoc.in",
  phone: `+91 ${BROCHURE_PHONE_NUMBER}`,
  company: "Weld.Doc",
} as const;

const sharedWhatsapp = {
  phone: `91${BROCHURE_PHONE_NUMBER}`,
  message: "Hi, I'd like to know more about Weld.Doc",
  label: "Chat with us on WhatsApp",
} as const;

const inrPricing: readonly BrochurePricingPlan[] = [
  {
    name: "Starter",
    welders: "Up to 3 welders / operators",
    period: "Free for 1 month",
    price: "₹0",
    note: "Try the full product – no card needed",
    features: ["All features unlocked", "Certificate & ID card PDF", "QR verification link"],
  },
  {
    name: "Growth",
    welders: "Up to 20 welders / operators",
    period: "Per year",
    price: "₹24,999",
    note: "The right size for most shops",
    features: ["Everything in Starter", "Bulk import of old records", "Priority email support"],
    featured: true,
  },
  {
    name: "Enterprise",
    welders: "Unlimited welders / operators",
    period: "Per year",
    price: "₹69,999",
    note: "Multi-site? Let's build it together",
    features: ["Everything in Growth", "Multi-branch management", "Dedicated onboarding"],
  },
];

const eurPricing: readonly BrochurePricingPlan[] = [
  {
    name: "Starter",
    welders: "Up to 3 welders / operators",
    period: "Free for 1 month",
    price: "€0",
    note: "Try the full product – no card needed",
    features: ["All features unlocked", "Certificate & ID card PDF", "QR verification link"],
  },
  {
    name: "Growth",
    welders: "Up to 20 welders / operators",
    period: "Per year",
    price: "€299",
    note: "The right size for most shops",
    features: ["Everything in Starter", "Bulk import of old records", "Priority email support"],
    featured: true,
  },
  {
    name: "Enterprise",
    welders: "Unlimited welders / operators",
    period: "Per year",
    price: "€645",
    note: "Multi-site? Let's build it together",
    features: ["Everything in Growth", "Multi-branch management", "Dedicated onboarding"],
  },
];

export const BROCHURE_REGIONS: Record<BrochureRegion, BrochureRegionalConfig> = {
  inr: {
    region: "inr",
    editionLabel: "INR",
    pdfPath: "/brochure/welddoc-brochure.pdf",
    pdfDownloadName: "welddoc-brochure.pdf",
    pdfScriptHint: "npm run brochure:pdf",
    contact: sharedContact,
    whatsapp: sharedWhatsapp,
    pricing: inrPricing,
  },
  eur: {
    region: "eur",
    editionLabel: "EUR",
    pdfPath: "/brochure/welddoc-brochure-eur.pdf",
    pdfDownloadName: "welddoc-brochure-eur.pdf",
    pdfScriptHint: "npm run brochure:pdf:eur",
    contact: sharedContact,
    whatsapp: sharedWhatsapp,
    pricing: eurPricing,
  },
};

export function getBrochureRegion(region: BrochureRegion): BrochureRegionalConfig {
  return BROCHURE_REGIONS[region];
}

export function brochureWhatsAppUrl(
  whatsapp: BrochureRegionalConfig["whatsapp"] = sharedWhatsapp,
): string {
  return `https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.message)}`;
}
