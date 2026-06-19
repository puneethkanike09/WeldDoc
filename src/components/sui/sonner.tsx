"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast flex items-center gap-2 rounded-[12px] border border-border bg-popover p-4 text-popover-foreground shadow-(--shadow-lift)",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          error: "text-destructive",
        },
      }}
      {...props}
    />
  );
}
