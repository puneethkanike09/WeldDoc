"use client";

import {
  ISO_14732,
  iso14732PdfHref,
  type Iso14732TableKey,
} from "@/lib/iso14732/standards-reference";
import { StandardPdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";

interface Iso14732PdfDrawerProps {
  page?: number;
  title?: string;
  description?: string;
  className?: string;
}

export function Iso14732PdfDrawer({
  page = ISO_14732.tables.revalidation.page,
  title = `${ISO_14732.title} — ${ISO_14732.tables.revalidation.label}`,
  description = "Reference PDF — open standard at the cited section",
  className,
}: Iso14732PdfDrawerProps) {
  return (
    <StandardPdfGlobe
      src={iso14732PdfHref(page)}
      title={title}
      description={description}
      className={className}
    />
  );
}

/** Globe trigger — opens clause 6.3 revalidation reference. */
export function Iso14732RevalidationPdfDrawer() {
  return <Iso14732PdfDrawer />;
}

/** Globe next to a field label — opens the relevant ISO 14732 section. */
export function Iso14732TablePdfGlobe({ table }: { table: Iso14732TableKey }) {
  const ref = ISO_14732.tables[table];
  return (
    <Iso14732PdfDrawer
      page={ref.page}
      title={`${ISO_14732.shortTitle} — ${ref.label}`}
      description={ref.label}
    />
  );
}
