"use client";

import { Eye, Trash2 } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/app/confirm-delete-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { deleteWelderGroupSession } from "@/app/(app)/welders/qualify/group/actions";
import { deleteOperatorGroupSession } from "@/app/(app)/operators/qualify/group/actions";

export function GroupSessionRowActions({
  sessionId,
  baseHref,
  canDelete,
  kind,
}: {
  sessionId: string;
  baseHref: string;
  canDelete: boolean;
  kind: "welder" | "operator";
}) {
  const deleteAction =
    kind === "welder" ? deleteWelderGroupSession : deleteOperatorGroupSession;

  return (
    <div className="flex items-center justify-end gap-2">
      <ButtonLink href={`${baseHref}/${sessionId}?step=1`} variant="primary" size="sm">
        <Eye className="h-4 w-4" />
        Open
      </ButtonLink>
      {canDelete ? (
        <ConfirmDeleteButton
          action={async () => {
            try {
              await deleteAction(sessionId);
            } catch (err) {
              if (isRedirectError(err)) throw err;
              toast.error(
                err instanceof Error ? err.message : "Could not delete session.",
              );
            }
          }}
          title="Delete this group session?"
          description="The session and any draft qualifications created for its participants will be removed. Sessions with issued certificates cannot be deleted. This cannot be undone."
          confirmLabel="Delete session"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-ember hover:bg-ember/10 hover:text-ember"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
