"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";
import type { AlertEvent, TimeRangeInput } from "@/types";
import { useAlertHistory, useSites } from "@/lib/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { AlertFilters, type AlertFilterState } from "./alert-filters";
import { AlertTable } from "./alert-table";
import { AlertDetailDialog } from "./alert-detail-dialog";

/** datetime-local strings are treated as UTC (Accra is GMT year-round). */
const toLocalInput = (ms: number) => new Date(ms).toISOString().slice(0, 16);
const fromLocalInput = (v: string) => new Date(`${v}:00Z`).toISOString();

function defaults(siteId: string | null): AlertFilterState {
  const now = Date.now();
  return {
    siteId: siteId ?? "all",
    level: "all",
    preset: "7d",
    from: toLocalInput(now - 7 * 86_400_000),
    to: toLocalInput(now),
    query: "",
  };
}

export function filterAlerts(alerts: AlertEvent[], f: Pick<AlertFilterState, "level" | "query">, siteNames: Record<string, string>) {
  const q = f.query.trim().toLowerCase();
  return alerts.filter((a) => {
    if (f.level !== "all" && a.alertStatus !== f.level) return false;
    if (!q) return true;
    return a.alertId.toLowerCase().includes(q) || (siteNames[a.siteId] ?? a.siteId).toLowerCase().includes(q);
  });
}

export function AlertsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<AlertFilterState>(() => defaults(params.get("siteId")));
  const selectedId = params.get("alertId");

  const range: TimeRangeInput =
    filters.preset === "custom" && filters.from && filters.to
      ? { fromUtc: fromLocalInput(filters.from), toUtc: fromLocalInput(filters.to) }
      : filters.preset === "24h"
        ? "24h"
        : "7d";

  const sites = useSites();
  const alerts = useAlertHistory(filters.siteId === "all" ? undefined : filters.siteId, range);

  const siteNames = useMemo(
    () => Object.fromEntries((sites.data ?? []).map((s) => [s.siteId, s.siteName])),
    [sites.data],
  );
  const visible = useMemo(() => filterAlerts(alerts.data ?? [], filters, siteNames), [alerts.data, filters, siteNames]);
  const counts = useMemo(
    () => ({
      warning: visible.filter((a) => a.alertStatus === "WARNING").length,
      watch: visible.filter((a) => a.alertStatus === "WATCH").length,
    }),
    [visible],
  );

  const setSelected = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set("alertId", id);
      else next.delete("alertId");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return (
    <div className="space-y-5">
      <AlertFilters
        value={filters}
        sites={sites.data ?? []}
        onChange={setFilters}
        onReset={() => setFilters(defaults(null))}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
        <p>
          <strong>{visible.length}</strong> alert{visible.length === 1 ? "" : "s"}
          {" · "}
          <span className="font-semibold text-status-warning">{counts.warning} Warning</span>
          {" · "}
          <span className="font-semibold text-status-watch">{counts.watch} Watch</span>
        </p>
        <p className="text-xs text-muted-foreground">Select a row to see the notification trail.</p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm" data-tour="alert-table">
        {alerts.isError ? (
          <ErrorState onRetry={() => alerts.refetch()} />
        ) : alerts.isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="No alerts match these filters" icon={<Bell aria-hidden="true" />}>
            Try a longer period, another site or clear the search.
          </EmptyState>
        ) : (
          <AlertTable alerts={visible} siteNames={siteNames} onSelect={setSelected} selectedId={selectedId} />
        )}
      </div>

      <AlertDetailDialog alertId={selectedId} siteNames={siteNames} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
