"use client";

import * as React from "react";
import ReactDatePicker from "react-datepicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/sui/button";

function parseISO(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DatePickerInputProps = {
  value?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
};

const DatePickerInput = React.forwardRef<HTMLButtonElement, DatePickerInputProps>(
  function DatePickerInput(
    {
      value,
      placeholder,
      className,
      disabled,
      onClick,
      onFocus,
      onBlur,
      onKeyDown,
    },
    ref,
  ) {
    const label = value || placeholder || "";

    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={cn(
          "h-11 w-full justify-start gap-2 px-3.5 font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate">{label}</span>
      </Button>
    );
  },
);

export function DatePicker({
  name,
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  placeholder = "Pick a date",
  captionLayout = "dropdown",
  className,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  className?: string;
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = isControlled ? (value as string) : internal;
  const date = parseISO(current);

  const showMonthDropdown =
    captionLayout === "dropdown" || captionLayout === "dropdown-months";
  const showYearDropdown =
    captionLayout === "dropdown" || captionLayout === "dropdown-years";

  const handleChange = (next: Date | null) => {
    const iso = next ? toISO(next) : "";
    if (!isControlled) setInternal(iso);
    onChange?.(iso);
  };

  return (
    <>
      {name && (
        <input type="hidden" name={name} value={current} required={required} />
      )}
      <ReactDatePicker
        selected={date ?? null}
        onChange={handleChange}
        disabled={disabled}
        showMonthDropdown={showMonthDropdown}
        showYearDropdown={showYearDropdown}
        dropdownMode="select"
        scrollableYearDropdown
        yearDropdownItemNumber={90}
        minDate={new Date(1940, 0, 1)}
        maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
        openToDate={date ?? new Date()}
        dateFormat="dd MMM yyyy"
        placeholderText={placeholder}
        wrapperClassName="welddoc-datepicker-wrapper"
        calendarClassName="welddoc-datepicker"
        popperClassName="welddoc-datepicker-popper"
        popperPlacement="bottom-start"
        customInput={
          <DatePickerInput className={className} disabled={disabled} />
        }
      />
    </>
  );
}
