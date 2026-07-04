import { FileSpreadsheet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function ImportOperatorsButton() {
  return (
    <ButtonLink href="/operators/import" variant="ghost" size="sm">
      <FileSpreadsheet className="h-4 w-4" />
      Existing Operator-Import Data
    </ButtonLink>
  );
}
