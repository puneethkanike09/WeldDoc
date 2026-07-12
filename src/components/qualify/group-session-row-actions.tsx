"use client";

import { useTransition } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/sui/alert-dialog";
import { buttonVariants } from "@/components/sui/button";
import { cn } from "@/lib/utils";
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
  const [pending, startTransition] = useTransition();
  const deleteAction =
    kind === "welder" ? deleteWelderGroupSession : deleteOperatorGroupSession;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAction(sessionId);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not delete session.",
        );
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <ButtonLink href={`${baseHref}/${sessionId}?step=1`} variant="primary" size="sm">
        <Eye className="h-4 w-4" />
        Open
      </ButtonLink>
      {canDelete ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-ember hover:text-ember",
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this group session?</AlertDialogTitle>
              <AlertDialogDescription>
                The session and any draft qualifications created for its
                participants will be removed. Issued certificates are kept and
                block deletion. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                className={cn(buttonVariants({ variant: "destructive" }))}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete session
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
