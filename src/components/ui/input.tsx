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
        "h-11 w-full rounded-[10px] border border-silver bg-panel px-3.5 text-[15px] text-onyx placeholder:text-steel transition-colors focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:opacity-50",
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
        "w-full rounded-[10px] border border-silver bg-panel px-3.5 py-2.5 text-[15px] text-onyx placeholder:text-steel transition-colors focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:opacity-50",
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
        "h-11 w-full rounded-[10px] border border-silver bg-panel px-3 text-[15px] text-onyx transition-colors focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
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
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-display text-[13px] font-medium tracking-tight text-charcoal",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-ember" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  hint,
  labelAccessory,
  required,
  error,
  children,
  className,
  reserveMessageSpace,
}: {
  label?: string;
  hint?: React.ReactNode;
  labelAccessory?: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  /** Keeps a fixed slot under the control so grid rows stay aligned when errors appear. */
  reserveMessageSpace?: boolean;
}) {
  const message = error ? (
    <p className="text-xs text-ember">{error}</p>
  ) : hint ? (
    <p className="text-xs text-steel">{hint}</p>
  ) : null;

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <Label required={required}>{label}</Label>
          {labelAccessory}
        </div>
      ) : null}
      {children}
      {reserveMessageSpace ? (
        <div className="mt-1 min-h-[1.125rem]">{message}</div>
      ) : (
        message && <div className="mt-1">{message}</div>
      )}
    </div>
  );
}
