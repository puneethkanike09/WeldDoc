"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Wires a visually hidden text input into native form validation. */
export function useValidationProxy({
  required,
  valid,
  message,
}: {
  required?: boolean;
  valid: boolean;
  message: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!required) {
      el.setCustomValidity("");
      return;
    }
    el.setCustomValidity(valid ? "" : message);
  }, [required, valid, message]);

  useEffect(() => {
    if (valid) setShowError(false);
  }, [valid]);

  useEffect(() => {
    const input = ref.current;
    const form = input?.closest("form");
    if (!form || !required) return;

    const onSubmit = () => {
      if (!valid) setShowError(true);
    };

    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, [required, valid]);

  return { ref, showError };
}

export function ValidationProxyInput({
  name,
  value,
  proxyRef,
  required,
}: {
  name?: string;
  value: string;
  proxyRef: RefObject<HTMLInputElement | null>;
  required?: boolean;
}) {
  if (!name) return null;

  return (
    <input
      ref={proxyRef}
      type="text"
      name={name}
      value={value}
      readOnly
      required={required}
      tabIndex={-1}
      aria-hidden="true"
      onChange={() => {}}
      onInvalid={(e) => {
        const root = e.currentTarget.parentElement;
        const focusable = root?.querySelector<HTMLElement>(
          'button:not([aria-hidden="true"]), [role="combobox"], input:not([aria-hidden="true"])',
        );
        if (focusable) {
          e.preventDefault();
          focusable.focus();
          focusable.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }}
      className="pointer-events-none absolute h-0 w-0 opacity-0"
    />
  );
}

export function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show || !message) return null;
  return <p className="mt-1 text-xs text-ember">{message}</p>;
}
