"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/sui/popover";
import { Button } from "@/components/sui/button";

function parseISO(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toISO(d?: Date): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  name,
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  placeholder = "Pick a date",
  captionLayout = "label",
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
  const [open, setOpen] = React.useState(false);
  const date = parseISO(current);

  const select = (d?: Date) => {
    const iso = toISO(d);
    if (!isControlled) setInternal(iso);
    onChange?.(iso);
    setOpen(false);
  };

  return (
    <>
      {name && (
        <input type="hidden" name={name} value={current} required={required} />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
            {date ? formatDate(date) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={select}
            defaultMonth={date}
            captionLayout={captionLayout}
            startMonth={new Date(1940, 0)}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
            className="rdp-weld"
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
