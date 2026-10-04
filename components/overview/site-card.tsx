import Link from "next/link";
import { ArrowRight, CloudRain, Droplets, TrendingUp, Clock } from "lucide-react";
import type { SiteOverview } from "@/types";
import { Button } from "@/components/ui/button";
import { RiskBadge, NodeStatusBadge } from "@/components/status/status-badge";
import { Metric } from "@/components/common/metric";
import { Sparkline } from "@/components/common/sparkline";
import { RISK_META, OFFLINE_HEX } from "@/lib/status";
import { formatNumber, formatRelative, formatRise, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SiteCardProps {
  overview: SiteOverview;
  nowMs: number;
  /** Water level values for the selected range, oldest first. */
  trend?: number[];
  alertsInRange?: number;
  rangeLabel?: string;
}

const levelEmphasis = (level: number, o: SiteOverview) =>
  level >= o.thresholds.waterWarningThresholdCm ? "warning" : level >= o.thresholds.waterWatchThresholdCm ? "watch" : "default";

export function SiteCard({ overview, nowMs, trend, alertsInRange, rangeLabel }: SiteCardProps) {
  const { site, latestReading: r, riskStatus, thresholds } = overview;
  const reporting = site.status === "ONLINE";
  const meta = RISK_META[riskStatus];
  const headingId = `site-${site.siteId}-name`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-t-4 bg-card text-card-foreground shadow-sm",
        riskStatus === "NORMAL" && "border-t-status-normal",
        riskStatus === "WATCH" && "border-t-status-watch",
        riskStatus === "WARNING" && "border-t-status-warning",
        !reporting && "border-t-status-offline",
      )}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0">
          <h2 id={headingId} className="truncate text-xl font-bold tracking-tight">
            {site.siteName}
          </h2>
          <p className="truncate text-xs text-muted-foreground">Node {site.nodeId}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <RiskBadge status={riskStatus} />
          {!reporting && <span className="text-[11px] font-medium text-muted-foreground">last known</span>}
        </div>
      </div>

      {!reporting && (
        <p className="mx-5 mb-3 rounded-md bg-status-offline-bg px-3 py-2 text-xs font-medium text-status-offline">
          {site.status === "OFFLINE" ? "Node offline." : "Node not reporting."} Values below are from the last
          transmission{r ? ` at ${formatTime(r.timestampUtc)} GMT` : ""} and may be out of date.
        </p>
      )}

      {r ? (
        <dl className="grid grid-cols-3 gap-3 px-5">
          <Metric
            size="sm"
            label="Water"
            icon={<Droplets aria-hidden="true" />}
            value={formatNumber(r.waterLevelCm)}
            unit="cm"
            emphasis={levelEmphasis(r.waterLevelCm, overview)}
          />
          <Metric
            size="sm"
            label="Rain"
            icon={<CloudRain aria-hidden="true" />}
            value={formatNumber(r.rainfallRateMmHr, 1)}
            unit="mm/hr"
            emphasis={r.rainfallRateMmHr >= thresholds.rainfallWatchThresholdMmHr ? "watch" : "default"}
          />
          <Metric
            size="sm"
            label="Rise"
            icon={<TrendingUp aria-hidden="true" />}
            value={formatRise(r.riseRateCmMin)}
            unit="cm/min"
            emphasis={r.riseRateCmMin >= thresholds.riseWarningThresholdCmMin ? "warning" : "default"}
          />
        </dl>
      ) : (
        <p className="px-5 text-sm text-muted-foreground">No readings received from this node yet.</p>
      )}

      {trend && trend.length > 1 && (
        <div className="mt-4 px-5">
          <Sparkline
            values={trend}
            color={reporting ? meta.hex : OFFLINE_HEX}
            references={[
              { value: thresholds.waterWatchThresholdCm, color: RISK_META.WATCH.hex },
              { value: thresholds.waterWarningThresholdCm, color: RISK_META.WARNING.hex },
            ]}
            label={`Water level trend for ${site.siteName}${rangeLabel ? `, ${rangeLabel}` : ""}`}
            className="h-12 w-full"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Water level{rangeLabel ? `, ${rangeLabel}` : ""}. Dashed lines: watch {thresholds.waterWatchThresholdCm} cm,
            danger {thresholds.waterWarningThresholdCm} cm.
          </p>
        </div>
      )}

      <div className="h-4" aria-hidden="true" />
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {r ? (
              <>
                Updated <time dateTime={r.timestampUtc}>{formatTime(r.timestampUtc)} GMT</time> (
                {formatRelative(r.timestampUtc, nowMs)})
              </>
            ) : (
              "Never reported"
            )}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <NodeStatusBadge status={site.status} />
            {alertsInRange !== undefined && (
              <span>
                {alertsInRange} alert{alertsInRange === 1 ? "" : "s"}
                {rangeLabel ? ` ${rangeLabel.toLowerCase()}` : ""}
              </span>
            )}
          </span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/sites/${site.siteId}`} aria-label={`View details for ${site.siteName}`}>
            View details
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
