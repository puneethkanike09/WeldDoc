"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "@/app/(app)/actions";
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

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      void signOut();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-graphite transition-colors hover:bg-onyx/5 hover:text-onyx"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of WeldDoc?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to access your welder registry,
            qualifications and reports.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out…
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign out
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
