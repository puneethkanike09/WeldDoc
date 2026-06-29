import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function ImportOperatorsButton() {
  return (
    <ButtonLink href="/operators/import" variant="ghost" size="sm">
      <FileSpreadsheet className="h-4 w-4" />
      Import from Excel
    </ButtonLink>
  );
}

export function ImportOperatorsLink() {
  return (
    <Link
      href="/operators/import"
      className="text-sm font-medium text-ember hover:underline"
    >
      Import from Excel
    </Link>
  );
}
