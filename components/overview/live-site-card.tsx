"use client";

import { useMemo } from "react";
import type { SiteOverview } from "@/types";
import { useTimeSeries } from "@/lib/hooks/queries";
import type { OverviewTimeRange } from "@/lib/store/overview-filters";
import { SiteCard } from "./site-card";

interface LiveSiteCardProps {
  overview: SiteOverview;
  nowMs: number;
  timeRange: OverviewTimeRange;
  rangeLabel: string;
  alertsInRange: number;
}

/** SiteCard wired to the time-series query for its sparkline. */
export function LiveSiteCard({ overview, timeRange, ...rest }: LiveSiteCardProps) {
  const { data } = useTimeSeries(overview.site.siteId, timeRange);
  const trend = useMemo(
    () => data?.filter((r) => r.dataValidity === "VALID").map((r) => r.waterLevelCm),
    [data],
  );
  return <SiteCard overview={overview} trend={trend} {...rest} />;
}
