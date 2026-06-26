"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Radix-backed Select that is API-compatible with the previous native
 * <Select> (accepts <option> children, `value`/`defaultValue`/`onChange`,
 * `name`, `disabled`). Empty-string option values (used as "— none —"
 * placeholders) are supported via an internal sentinel + a hidden input so
 * existing FormData server actions keep receiving "" unchanged.
 */

const EMPTY = "\u0000empty";

type Opt = { value: string; label: React.ReactNode; disabled?: boolean };

function extractOptions(children: React.ReactNode): Opt[] {
  const opts: Opt[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as React.ReactElement<{
      value?: string | number;
      children?: React.ReactNode;
      disabled?: boolean;
    }>;
    if (el.type === "option") {
      opts.push({
        value: String(el.props.value ?? ""),
        label: el.props.children,
        disabled: el.props.disabled,
      });
    } else if (el.props?.children) {
      opts.push(...extractOptions(el.props.children));
    }
  });
  return opts;
}

const triggerClasses =
  "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-input bg-panel px-3.5 text-[15px] text-onyx transition-colors data-[placeholder]:text-steel focus:border-onyx focus:outline-none focus:ring-2 focus:ring-onyx/15 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left";

export interface SelectProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  function Select(
    { name, value, defaultValue, onChange, disabled, required, placeholder, className, children },
    ref,
  ) {
    const options = React.useMemo(() => extractOptions(children), [children]);
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue ?? "");
    const current = isControlled ? (value as string) : internal;

    const toRadix = (v: string) => (v === "" ? EMPTY : v);
    const fromRadix = (v: string) => (v === EMPTY ? "" : v);
    const radixValue = toRadix(current);
    const hasOption = options.some((o) => toRadix(o.value) === radixValue);
    const safeValue = hasOption ? radixValue : undefined;

    const handle = React.useCallback(
      (rv: string) => {
        const real = fromRadix(rv);
        if (real === current) return;
        if (!isControlled) setInternal(real);
        onChange?.({ target: { value: real } });
      },
      [current, isControlled, onChange],
    );

    return (
      <>
        {name ? (
          <input
            type="text"
            name={name}
            value={current}
            readOnly
            required={required}
            tabIndex={-1}
            aria-hidden="true"
            onChange={() => {}}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />
        ) : null}
        <SelectPrimitive.Root
          value={safeValue}
          onValueChange={handle}
          disabled={disabled}
          required={required}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(triggerClasses, className)}
            suppressHydrationWarning
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={4}
              className="relative z-50 max-h-96 min-w-32 w-(--radix-select-trigger-width) overflow-hidden rounded-[10px] border border-border bg-popover text-popover-foreground shadow-(--shadow-lift) data-[state=open]:animate-in data-[state=open]:fade-in-0"
            >
              <SelectPrimitive.Viewport className="sleek-scroll max-h-[300px] overflow-y-auto p-1">
                {options.map((o) => (
                  <SelectPrimitive.Item
                    key={o.value || EMPTY}
                    value={toRadix(o.value)}
                    disabled={o.disabled}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-8 text-[15px] text-onyx outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[state=checked]:font-medium data-disabled:pointer-events-none data-disabled:opacity-50"
                  >
                    <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                    <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4 text-primary" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </>
    );
  },
);
