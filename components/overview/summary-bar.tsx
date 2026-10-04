import { Radio, CircleCheck, TriangleAlert, OctagonAlert, WifiOff } from "lucide-react";
import type { SiteOverview } from "@/types";
import { cn } from "@/lib/utils";

interface SummaryBarProps {
  overviews: SiteOverview[];
}

export function summarise(overviews: SiteOverview[]) {
  const count = (fn: (o: SiteOverview) => boolean) => overviews.filter(fn).length;
  return {
    total: overviews.length,
    online: count((o) => o.site.status === "ONLINE"),
    notReporting: count((o) => o.site.status !== "ONLINE"),
    normal: count((o) => o.riskStatus === "NORMAL"),
    watch: count((o) => o.riskStatus === "WATCH"),
    warning: count((o) => o.riskStatus === "WARNING"),
  };
}

export function SummaryBar({ overviews }: SummaryBarProps) {
  const s = summarise(overviews);
  const items = [
    {
      label: "Nodes online",
      value: `${s.online}/${s.total}`,
      icon: Radio,
      tone: "text-primary bg-accent",
      hint: s.notReporting > 0 ? `${s.notReporting} stale or offline` : "All reporting",
    },
    { label: "Normal", value: s.normal, icon: CircleCheck, tone: "text-status-normal bg-status-normal-bg", hint: s.normal === 1 ? "site" : "sites" },
    { label: "Watch", value: s.watch, icon: TriangleAlert, tone: "text-status-watch bg-status-watch-bg", hint: s.watch === 1 ? "site" : "sites" },
    { label: "Warning", value: s.warning, icon: OctagonAlert, tone: "text-status-warning bg-status-warning-bg", hint: s.warning === 1 ? "site" : "sites" },
  ];

  return (
    <section aria-label="System summary" data-tour="summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone, hint }) => (
        <div key={label} className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
            <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
      ))}
      {s.warning > 0 && (
        <p
          role="status"
          className="col-span-2 flex items-center gap-2 rounded-lg border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm font-semibold text-status-warning lg:col-span-4"
        >
          <OctagonAlert className="size-5 shrink-0" aria-hidden="true" />
          {s.warning} site{s.warning === 1 ? " is" : "s are"} on Warning. Water is above the danger line and rising fast.
        </p>
      )}
      {s.notReporting > 0 && (
        <p className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground lg:col-span-4">
          <WifiOff className="size-4 shrink-0" aria-hidden="true" />
          Risk for stale or offline nodes is the last known status.
        </p>
      )}
    </section>
  );
}
