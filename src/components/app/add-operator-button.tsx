import { ButtonLink } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export function AddOperatorButton() {
  return (
    <ButtonLink href="/operators/new">
      <UserPlus className="h-4 w-4" /> Add operator
    </ButtonLink>
  );
}
