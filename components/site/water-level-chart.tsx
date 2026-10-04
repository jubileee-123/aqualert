"use client";

import { memo, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { AlertThresholds, SensorReading, TimeRange } from "@/types";
import { RISK_META } from "@/lib/status";
import { formatAxisTime, formatDateTime, formatNumber, formatRise } from "@/lib/format";
import { AXIS_STYLE, GRID_STROKE, isMultiDay } from "./chart-utils";

interface Point {
  t: number;
  level: number;
  rise: number;
  suspect: boolean;
}

interface WaterLevelChartProps {
  readings: SensorReading[];
  thresholds: AlertThresholds;
  range: TimeRange;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const p = payload?.[0]?.payload as Point | undefined;
  if (!active || !p) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{formatDateTime(new Date(p.t).toISOString())}</p>
      <p>
        Water level: <strong>{formatNumber(p.level, 1)} cm</strong>
      </p>
      <p>Rise rate: {formatRise(p.rise)} cm/min</p>
      {p.suspect && <p className="font-semibold text-status-watch">Suspect reading (sensor echo), ignored by alerts</p>}
    </div>
  );
}

/** Water level over time with dashed Watch and Warning (danger) threshold lines. */
export const WaterLevelChart = memo(function WaterLevelChart({ readings, thresholds, range }: WaterLevelChartProps) {
  const data = useMemo<Point[]>(
    () =>
      readings.map((r) => ({
        t: Date.parse(r.timestampUtc),
        level: r.waterLevelCm,
        rise: r.riseRateCmMin,
        suspect: r.dataValidity !== "VALID",
      })),
    [readings],
  );

  const stats = useMemo(() => {
    const valid = data.filter((d) => !d.suspect).map((d) => d.level);
    return valid.length
      ? { min: Math.min(...valid), max: Math.max(...valid), last: valid[valid.length - 1] ?? 0 }
      : null;
  }, [data]);

  const yMax = Math.ceil(Math.max(thresholds.waterWarningThresholdCm * 1.15, (stats?.max ?? 0) * 1.1) / 10) * 10;
  const multiDay = isMultiDay(range);

  return (
    <figure className="space-y-3">
      <div className="h-64 w-full sm:h-80" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => formatAxisTime(v, multiDay)}
              tick={AXIS_STYLE}
              minTickGap={48}
            />
            <YAxis domain={[0, yMax]} tick={AXIS_STYLE} width={44} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={thresholds.waterWatchThresholdCm}
              stroke={RISK_META.WATCH.hex}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `Watch ${thresholds.waterWatchThresholdCm} cm`, position: "insideTopLeft", fill: RISK_META.WATCH.hex, fontSize: 11, fontWeight: 600 }}
            />
            <ReferenceLine
              y={thresholds.waterWarningThresholdCm}
              stroke={RISK_META.WARNING.hex}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `Danger ${thresholds.waterWarningThresholdCm} cm`, position: "insideTopLeft", fill: RISK_META.WARNING.hex, fontSize: 11, fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#0b4f7c"
              strokeWidth={2.25}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: Point; key?: string }) =>
                props.payload?.suspect ? (
                  <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="#fff" stroke={RISK_META.WATCH.hex} strokeWidth={2} />
                ) : (
                  <g key={props.key} />
                )
              }
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="space-y-2 text-xs text-muted-foreground">
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Chart legend">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-[#0b4f7c]" aria-hidden="true" /> Water level
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: RISK_META.WATCH.hex }} aria-hidden="true" />
            Watch line: at or above this level the site goes on Watch
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: RISK_META.WARNING.hex }} aria-hidden="true" />
            Danger line: above this and rising faster than {thresholds.riseWarningThresholdCmMin} cm/min means Warning
          </li>
        </ul>
        <p className="sr-only" data-testid="water-chart-summary">
          {stats
            ? `Water level ranged from ${formatNumber(stats.min)} to ${formatNumber(stats.max)} cm; latest ${formatNumber(stats.last)} cm. Watch line ${thresholds.waterWatchThresholdCm} cm, danger line ${thresholds.waterWarningThresholdCm} cm.`
            : "No water level readings in this period."}
        </p>
      </figcaption>
    </figure>
  );
});
