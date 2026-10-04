import { CloudRain, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Says plainly which numbers are real and which are simulated. Shown wherever
 * both kinds sit side by side, until real AquaLert sensors are connected.
 */
export function DataSourceNote({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-sand-300 bg-sand-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-6",
        className,
      )}
      role="note"
      aria-label="Where this data comes from"
    >
      <p className="flex items-start gap-2">
        <CloudRain className="mt-0.5 size-4 shrink-0 text-lagoon-700" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Live:</strong> rainfall and rain forecast from Open-Meteo weather models.
        </span>
      </p>
      <p className="flex items-start gap-2">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-sand-700" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Simulated:</strong> sensor readings (water level, gauge rainfall, rise rate), alerts and node health
          {compact ? "" : ", until AquaLert sensors are installed"}.
        </span>
      </p>
    </div>
  );
}

/** Small inline tag marking a value as live or simulated. */
export function SourceTag({ kind, className }: { kind: "live" | "simulated"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        kind === "live" ? "bg-lagoon-50 text-lagoon-800 ring-1 ring-lagoon-200" : "bg-sand-100 text-sand-800 ring-1 ring-sand-300",
        className,
      )}
    >
      {kind === "live" && <span className="size-1.5 rounded-full bg-lagoon-500" aria-hidden="true" />}
      {kind === "live" ? "Live" : "Simulated"}
    </span>
  );
}
