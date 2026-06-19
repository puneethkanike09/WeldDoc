import { ButtonLink } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export function AddWelderButton() {
  return (
    <ButtonLink href="/welders/new">
      <UserPlus className="h-4 w-4" /> Add welder
    </ButtonLink>
  );
}
