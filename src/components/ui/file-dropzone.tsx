"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

function assignToInput(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer();
  for (const file of files) {
    dt.items.add(file);
  }
  input.files = dt.files;
}

function describeFiles(files: File[]): string {
  if (files.length === 0) return "";
  if (files.length === 1) return files[0].name;
  return `${files.length} files selected`;
}

export function FileDropzone({
  name,
  accept,
  required,
  multiple,
  placeholder = "Drop file here or click to browse",
  defaultLabel,
  className,
  compact,
}: {
  name: string;
  accept?: string;
  required?: boolean;
  multiple?: boolean;
  placeholder?: string;
  defaultLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [label, setLabel] = useState(defaultLabel ?? null);

  const applyFiles = useCallback(
    (files: File[]) => {
      const input = inputRef.current;
      if (!input || files.length === 0) return;
      const picked = multiple ? files : files.slice(0, 1);
      assignToInput(input, picked);
      setLabel(describeFiles(picked));
    },
    [multiple],
  );

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[10px] border border-dashed transition-colors",
        compact
          ? "h-11 bg-panel px-3 text-[13px]"
          : "bg-frost px-4 py-3.5 text-sm",
        dragOver
          ? "border-ember bg-ember/5"
          : "border-silver hover:border-onyx/40",
        className,
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        applyFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <UploadCloud
        className={cn("shrink-0 text-steel", compact ? "h-4 w-4" : "h-5 w-5")}
      />
      <span
        className={cn(
          "min-w-0 truncate text-graphite",
          label && "font-medium text-charcoal",
        )}
      >
        {label ?? placeholder}
      </span>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          setLabel(files.length ? describeFiles(files) : defaultLabel ?? null);
        }}
      />
    </label>
  );
}
