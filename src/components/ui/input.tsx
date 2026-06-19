import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[10px] border border-silver bg-white px-3.5 text-[15px] text-onyx placeholder:text-steel transition-colors focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[10px] border border-silver bg-white px-3.5 py-2.5 text-[15px] text-onyx placeholder:text-steel transition-colors focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[10px] border border-silver bg-white px-3 text-[15px] text-onyx transition-colors focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-display text-[13px] font-medium tracking-tight text-charcoal",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-1 text-xs text-steel">{hint}</p>}
    </div>
  );
}
