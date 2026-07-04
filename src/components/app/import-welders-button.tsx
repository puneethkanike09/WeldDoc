import { FileSpreadsheet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function ImportWeldersButton() {
  return (
    <ButtonLink href="/welders/import" variant="ghost" size="sm">
      <FileSpreadsheet className="h-4 w-4" />
      Existing Welder-Import Data
    </ButtonLink>
  );
}
