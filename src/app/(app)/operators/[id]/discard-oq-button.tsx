"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function DiscardOqButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  const handleDiscard = () => {
    startTransition(() => {
      void action();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-ember">
          <Trash2 className="h-4 w-4" /> Discard draft
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard this qualification draft?</AlertDialogTitle>
          <AlertDialogDescription>
            It will be removed from the operator profile. Any saved test data
            and uploaded reports for this draft will be deleted. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(e) => {
              e.preventDefault();
              handleDiscard();
            }}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Discarding…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Discard draft
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
