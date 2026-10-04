"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { TimeRange } from "@/types";
import { useAlertHistory, useLatestReading, useSite, useTimeSeries } from "@/lib/hooks/queries";
import { useNow } from "@/lib/hooks/use-now";
import { getThresholds } from "@/lib/constants/thresholds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/common/segmented";
import { EmptyState, ErrorState } from "@/components/common/states";
import { CurrentConditionPanel } from "./current-condition-panel";
import { NodeHealthPanel } from "./node-health-panel";
import { WaterLevelChart } from "./water-level-chart";
import { RainfallChart } from "./rainfall-chart";
import { RecentAlertsList } from "./recent-alerts-list";
import { CHART_RANGES } from "./chart-utils";

type ChartRange = (typeof CHART_RANGES)[number]["value"];

export function SiteDetail({ siteId }: { siteId: string }) {
  const nowMs = useNow();
  const [range, setRange] = useState<ChartRange>("24h");
  const site = useSite(siteId);
  const latest = useLatestReading(siteId);
  const alerts = useAlertHistory(siteId, "7d");
  const series = useTimeSeries(siteId, range as TimeRange);
  const thresholds = getThresholds(siteId);

  const back = (
    <nav aria-label="Breadcrumb" className="mb-4">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          Back to overview
        </Link>
      </Button>
    </nav>
  );

  if (site.isError) return (<>{back}<ErrorState onRetry={() => site.refetch()} /></>);
  if (site.isPending) {
    return (
      <>
        {back}
        <Skeleton className="mb-4 h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }
  if (!site.data) {
    return (
      <>
        {back}
        <EmptyState title="Site not found">
          There is no AquaLert site with the ID “{siteId}”. <Link className="underline" href="/">Return to the overview</Link>.
        </EmptyState>
      </>
    );
  }

  const s = site.data;
  const lastAlert = alerts.data?.[0] ?? null;
  const risk = lastAlert?.alertStatus ?? "NORMAL";

  return (
    <div className="space-y-5">
      <div>
        {back}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{s.siteName}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden="true" />
          {s.description} ({s.latitude.toFixed(4)}, {s.longitude.toFixed(4)})
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2" data-tour="current-condition">
          {latest.isPending ? (
            <Skeleton className="h-64" />
          ) : (
            <CurrentConditionPanel
              site={s}
              reading={latest.data ?? null}
              risk={risk}
              lastAlert={lastAlert}
              thresholds={thresholds}
              nowMs={nowMs}
            />
          )}
        </div>
        <div data-tour="node-health">
          <NodeHealthPanel site={s} reading={latest.data ?? null} nowMs={nowMs} />
        </div>
      </div>

      <section aria-labelledby="trends-heading" className="space-y-4" data-tour="trends">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="trends-heading" className="text-xl font-bold tracking-tight">
              Trends
            </h2>
            <p className="text-sm text-muted-foreground">Hover or tap the charts for exact values.</p>
          </div>
          <Segmented label="Chart time range" value={range} options={CHART_RANGES} onChange={setRange} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Water level</CardTitle>
              <CardDescription>Centimetres above the channel bed</CardDescription>
            </CardHeader>
            <CardContent aria-busy={series.isFetching}>
              {series.isPending ? (
                <Skeleton className="h-64 sm:h-80" />
              ) : series.data && series.data.length > 0 ? (
                <WaterLevelChart readings={series.data} thresholds={thresholds} range={range} />
              ) : (
                <EmptyState title="No readings in this period">
                  The node did not report during the selected window. Try a longer range.
                </EmptyState>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rainfall intensity</CardTitle>
              <CardDescription>Millimetres per hour from the tipping-bucket gauge</CardDescription>
            </CardHeader>
            <CardContent>
              {series.isPending ? (
                <Skeleton className="h-52 sm:h-64" />
              ) : series.data && series.data.length > 0 ? (
                <RainfallChart readings={series.data} thresholds={thresholds} range={range} />
              ) : (
                <EmptyState title="No readings in this period" />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card data-tour="recent-alerts">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Recent alerts</CardTitle>
            <CardDescription>Status changes in the last 7 days</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/alerts?siteId=${s.siteId}`}>All alerts for {s.siteName}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {alerts.isPending ? <Skeleton className="h-32" /> : <RecentAlertsList alerts={alerts.data ?? []} />}
        </CardContent>
      </Card>
    </div>
  );
}
