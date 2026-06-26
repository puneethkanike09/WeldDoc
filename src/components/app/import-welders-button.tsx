import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function ImportWeldersButton() {
  return (
    <ButtonLink href="/welders/import" variant="ghost" size="sm">
      <FileSpreadsheet className="h-4 w-4" />
      Import from Excel
    </ButtonLink>
  );
}

export function ImportWeldersLink() {
  return (
    <Link
      href="/welders/import"
      className="text-sm font-medium text-ember hover:underline"
    >
      Import from Excel
    </Link>
  );
}
