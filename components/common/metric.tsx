import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  emphasis?: "default" | "watch" | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** A labelled numeric reading. Uses <dl>-friendly markup via a definition-like pair. */
export function Metric({ label, value, unit, hint, icon, emphasis = "default", size = "md", className }: MetricProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1">
        <span
          className={cn(
            "font-bold tabular-nums tracking-tight",
            size === "sm" ? "text-xl" : size === "md" ? "text-2xl" : "text-3xl sm:text-4xl",
            emphasis === "watch" && "text-status-watch",
            emphasis === "warning" && "text-status-warning",
          )}
        >
          {value}
        </span>
        {unit && (
          <span className={cn("text-sm font-medium text-muted-foreground", size === "sm" ? "block text-xs" : "ml-1")}>
            {unit}
          </span>
        )}
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}
