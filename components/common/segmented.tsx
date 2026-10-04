"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}

/** Small toggle-button group (radio semantics) used for time ranges and view modes. */
export function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md border bg-muted p-0.5", className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const idx = options.findIndex((x) => x.value === value);
              const next = options[(idx + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length];
              if (next) {
                onChange(next.value);
                const group = e.currentTarget.parentElement;
                requestAnimationFrame(() =>
                  group?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus(),
                );
              }
            }}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4",
              selected && "bg-background text-foreground shadow-sm",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
