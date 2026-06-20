"use client";

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hasFieldErrors, type FieldErrors } from "@/lib/field-errors";

const FormPendingContext = createContext(false);

export function useFormPending() {
  return useContext(FormPendingContext);
}

/** Server action errors only — client validation uses inline field messages. */
export async function runServerAction(
  action: (formData: FormData) => void | Promise<unknown>,
  formData: FormData,
) {
  try {
    await action(formData);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    toast.error(err instanceof Error ? err.message : "Something went wrong.");
  }
}

export function useFormSubmit(
  action: (formData: FormData) => void | Promise<unknown>,
  validate?: (formData: FormData) => FieldErrors,
  prepare?: (formData: FormData) => void,
) {
  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      prepare?.(formData);
      const fieldErrors = validate?.(formData) ?? {};
      if (hasFieldErrors(fieldErrors)) return;
      startTransition(() => {
        void runServerAction(action, formData);
      });
    },
    [action, validate, prepare],
  );

  return { onSubmit, pending };
}

/** @deprecated Use useFormSubmit */
export const useFormToast = useFormSubmit;

/** Form wrapper — server errors via Sonner; pass validate for inline field errors. */
export function ServerActionForm({
  action,
  validate,
  prepare,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<unknown>;
  validate?: (formData: FormData) => FieldErrors;
  prepare?: (formData: FormData) => void;
  className?: string;
  children: ReactNode;
}) {
  const { onSubmit, pending } = useFormSubmit(action, validate, prepare);
  return (
    <FormPendingContext.Provider value={pending}>
      <form onSubmit={onSubmit} className={className} noValidate>
        {children}
      </form>
    </FormPendingContext.Provider>
  );
}
