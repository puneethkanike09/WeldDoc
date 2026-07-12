"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hasFieldErrors, type FieldErrors } from "@/lib/field-errors";
import {
  applyQualifyDraft,
  clearQualifyDraft,
  loadQualifyDraft,
  saveQualifyDraft,
} from "@/lib/qualify/wizard-draft";

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

function formSnapshot(form: HTMLFormElement): string {
  const fd = new FormData(form);
  const pairs: string[] = [];
  for (const [key, value] of fd.entries()) {
    if (value instanceof File) continue;
    pairs.push(`${key}=${String(value)}`);
  }
  return pairs.sort().join("&");
}

/** Like ServerActionForm but exposes fieldErrors to children for inline validation UI. */
export function ValidatedForm({
  action,
  validate,
  prepare,
  className,
  draftStorageKey,
  stepNumber,
  children,
}: {
  action: (formData: FormData) => void | Promise<unknown>;
  validate: (formData: FormData) => FieldErrors;
  prepare?: (formData: FormData) => void;
  className?: string;
  draftStorageKey?: string | null;
  stepNumber?: number;
  children: (ctx: {
    fieldErrors: FieldErrors;
    clearError: (key: string) => void;
    draftRevision: number;
    dirty: boolean;
  }) => ReactNode;
}) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [draftRevision, setDraftRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const baselineRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draftStorageKey || !formRef.current) return;
    const draft = loadQualifyDraft(draftStorageKey);
    if (!draft) return;
    applyQualifyDraft(formRef.current, draft);
    setDraftRevision(1);
  }, [draftStorageKey]);

  useEffect(() => {
    if (!formRef.current) return;
    const id = requestAnimationFrame(() => {
      if (!formRef.current) return;
      baselineRef.current = formSnapshot(formRef.current);
      setDirty(false);
    });
    return () => cancelAnimationFrame(id);
  }, [draftRevision, draftStorageKey, stepNumber]);

  const wrappedValidate = useCallback(
    (formData: FormData) => {
      const errors = validate(formData);
      setFieldErrors(errors);
      return errors;
    },
    [validate],
  );

  const clearError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const wrappedPrepare = useCallback(
    (formData: FormData) => {
      if (draftStorageKey) clearQualifyDraft(draftStorageKey);
      prepare?.(formData);
    },
    [draftStorageKey, prepare],
  );

  const persistDraft = useCallback(() => {
    if (!draftStorageKey || !formRef.current) return;
    saveQualifyDraft(draftStorageKey, formRef.current);
  }, [draftStorageKey]);

  const onFormChange = useCallback(() => {
    persistDraft();
    if (!formRef.current || baselineRef.current === null) return;
    setDirty(formSnapshot(formRef.current) !== baselineRef.current);
  }, [persistDraft]);

  const { onSubmit, pending } = useFormSubmit(
    action,
    wrappedValidate,
    wrappedPrepare,
  );

  return (
    <FormPendingContext.Provider value={pending}>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        onChange={onFormChange}
        className={className}
        noValidate
        {...(stepNumber != null
          ? { "data-qualify-step": String(stepNumber) }
          : {})}
      >
        {children({ fieldErrors, clearError, draftRevision, dirty })}
      </form>
    </FormPendingContext.Provider>
  );
}
