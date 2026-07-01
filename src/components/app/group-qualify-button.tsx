import { ButtonLink } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

/** Secondary action on the welders/operators registry header. */
export function GroupQualifyButton({ href }: { href: string }) {
  return (
    <ButtonLink href={href} variant="subtle">
      <Users className="h-4 w-4" /> Group qualify
    </ButtonLink>
  );
}

/** Primary action on the group sessions list page. */
export function NewGroupSessionButton({ href }: { href: string }) {
  return (
    <ButtonLink href={href}>
      <Plus className="h-4 w-4" /> New group session
    </ButtonLink>
  );
}
