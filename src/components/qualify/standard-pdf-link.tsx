import { ExternalLink } from "lucide-react";
import { ISO_9606_1, iso9606PdfHref } from "@/lib/iso9606/standards-reference";

export function StandardPdfLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-graphite underline decoration-silver underline-offset-2 transition-colors hover:text-onyx"
    >
      {children}
      <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

export function Iso9606RevalidationPdfLink({
  label,
}: {
  label: string;
}) {
  return (
    <StandardPdfLink href={iso9606PdfHref(ISO_9606_1.tables.revalidation.page)}>
      {label}
    </StandardPdfLink>
  );
}
