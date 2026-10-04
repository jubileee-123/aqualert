"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { SiteOverview } from "@/types";
import { useAlertHistory, useSiteOverviews } from "@/lib/hooks/queries";
import { useNow } from "@/lib/hooks/use-now";
import { useOverviewFilters } from "@/lib/store/overview-filters";
import { RISK_META } from "@/lib/status";
import { formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge, NodeStatusBadge } from "@/components/status/status-badge";
import { EmptyState, ErrorState } from "@/components/common/states";
import { SummaryBar } from "./summary-bar";
import { OverviewFilters, OVERVIEW_RANGES } from "./overview-filters";
import { LiveSiteCard } from "./live-site-card";
import { SiteMapLazy } from "./site-map-lazy";
import { MapLegend } from "./map-legend";
import { DataSourceNote } from "@/components/weather/data-source-note";
import { RainOutlookPanel } from "@/components/weather/rain-outlook-panel";

/** Most urgent first: Warning, Watch, Normal; reporting nodes before silent ones. */
export function sortByUrgency(a: SiteOverview, b: SiteOverview): number {
  const rank = RISK_META[b.riskStatus].rank - RISK_META[a.riskStatus].rank;
  if (rank !== 0) return rank;
  const online = Number(b.site.status === "ONLINE") - Number(a.site.status === "ONLINE");
  if (online !== 0) return online;
  return a.site.siteName.localeCompare(b.site.siteName);
}

export function OverviewDashboard() {
  const nowMs = useNow();
  const { data, isPending, isError, refetch } = useSiteOverviews();
  const { siteId, status, timeRange, view } = useOverviewFilters();
  const alerts = useAlertHistory(undefined, timeRange);
  const rangeLabel = OVERVIEW_RANGES.find((r) => r.value === timeRange)?.label ?? "";

  const visible = useMemo(
    () =>
      (data ?? [])
        .filter((o) => siteId === "all" || o.site.siteId === siteId)
        .filter((o) => status === "all" || o.riskStatus === status)
        .sort(sortByUrgency),
    [data, siteId, status],
  );

  const alertCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of alerts.data ?? []) counts.set(a.siteId, (counts.get(a.siteId) ?? 0) + 1);
    return counts;
  }, [alerts.data]);

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <DataSourceNote />
      {isPending ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[78px]" />
          ))}
        </div>
      ) : (
        <SummaryBar overviews={data} />
      )}

      <OverviewFilters sites={(data ?? []).map((o) => o.site)} />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="No sites match these filters">Try another status or choose all sites.</EmptyState>
      ) : view === "map" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <div className="h-[360px] overflow-hidden rounded-lg border shadow-sm sm:h-[480px]">
              <SiteMapLazy overviews={visible} />
            </div>
            <MapLegend />
          </div>
          <ul className="divide-y rounded-lg border bg-card shadow-sm" aria-label="Sites">
            {visible.map(({ site, riskStatus, latestReading }) => (
              <li key={site.siteId}>
                <Link
                  href={`/sites/${site.siteId}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{site.siteName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {latestReading ? `${formatNumber(latestReading.waterLevelCm)} cm · ${formatNumber(latestReading.rainfallRateMmHr, 1)} mm/hr` : "No data"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <RiskBadge status={riskStatus} size="sm" />
                    {site.status !== "ONLINE" && <NodeStatusBadge status={site.status} />}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Monitoring sites">
          {visible.map((o, i) => (
            <li key={o.site.siteId} data-tour={i === 0 ? "site-card" : undefined}>
              <LiveSiteCard
                overview={o}
                nowMs={nowMs}
                timeRange={timeRange}
                rangeLabel={rangeLabel}
                alertsInRange={alertCounts.get(o.site.siteId) ?? 0}
              />
            </li>
          ))}
        </ul>
      )}

      <RainOutlookPanel />
    </div>
  );
}
