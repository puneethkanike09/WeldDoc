"use client";

import { useTransition, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
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

/**
 * Generic destructive-confirm button. Pass the trigger element (e.g. a Button)
 * and a server action to run on confirm.
 */
export function ConfirmDeleteButton({
  action,
  title,
  description,
  confirmLabel = "Delete",
  trigger,
}: {
  action: () => Promise<void>;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  trigger: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(() => {
      void action();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
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
                {confirmLabel}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
