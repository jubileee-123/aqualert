import { CloudRain, Droplets, TrendingUp, Clock } from "lucide-react";
import type { AlertEvent, AlertStatus, AlertThresholds, SensorReading, Site } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/status/status-badge";
import { Metric } from "@/components/common/metric";
import { RISK_META } from "@/lib/status";
import { formatNumber, formatRelative, formatRise, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  site: Site;
  reading: SensorReading | null;
  risk: AlertStatus;
  lastAlert: AlertEvent | null;
  thresholds: AlertThresholds;
  nowMs: number;
}

export function CurrentConditionPanel({ site, reading, risk, lastAlert, thresholds, nowMs }: Props) {
  const meta = RISK_META[risk];
  const reporting = site.status === "ONLINE";
  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between",
          reporting ? meta.badge : "bg-status-offline-bg text-status-offline",
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
            Current status{!reporting && " (last known)"}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <RiskBadge status={risk} size="lg" className="bg-white" />
          </div>
          <p className="mt-2 max-w-prose text-sm font-medium">{meta.description}</p>
        </div>
        {lastAlert && (
          <p className="text-sm sm:max-w-xs sm:text-right">
            <span className="block text-xs font-semibold uppercase tracking-wider opacity-90">Since</span>
            {formatTime(lastAlert.alertCreatedAtUtc)} GMT ({formatRelative(lastAlert.alertCreatedAtUtc, nowMs)})
          </p>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Key readings</CardTitle>
      </CardHeader>
      <CardContent>
        {reading ? (
          <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Metric
              size="lg"
              label="Water level"
              icon={<Droplets aria-hidden="true" />}
              value={formatNumber(reading.waterLevelCm)}
              unit="cm"
              hint={`Watch ${thresholds.waterWatchThresholdCm} · Danger ${thresholds.waterWarningThresholdCm} cm`}
              emphasis={
                reading.waterLevelCm >= thresholds.waterWarningThresholdCm
                  ? "warning"
                  : reading.waterLevelCm >= thresholds.waterWatchThresholdCm
                    ? "watch"
                    : "default"
              }
            />
            <Metric
              size="lg"
              label="Rainfall rate"
              icon={<CloudRain aria-hidden="true" />}
              value={formatNumber(reading.rainfallRateMmHr, 1)}
              unit="mm/hr"
              hint={`${formatNumber(reading.rainfallTotalMm, 1)} mm today · Watch ${thresholds.rainfallWatchThresholdMmHr} mm/hr`}
              emphasis={reading.rainfallRateMmHr >= thresholds.rainfallWatchThresholdMmHr ? "watch" : "default"}
            />
            <Metric
              size="lg"
              label="Rise rate"
              icon={<TrendingUp aria-hidden="true" />}
              value={formatRise(reading.riseRateCmMin)}
              unit="cm/min"
              hint={`Rapid rise ${thresholds.riseWarningThresholdCmMin} cm/min`}
              emphasis={reading.riseRateCmMin >= thresholds.riseWarningThresholdCmMin ? "warning" : "default"}
            />
            <Metric
              size="lg"
              label="Last update"
              icon={<Clock aria-hidden="true" />}
              value={formatTime(reading.timestampUtc)}
              unit="GMT"
              hint={formatRelative(reading.timestampUtc, nowMs)}
            />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">This node has not sent any readings yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
