"use client";

import { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { AlertThresholds, SensorReading, TimeRange } from "@/types";
import { RISK_META } from "@/lib/status";
import { formatAxisTime, formatDateTime, formatNumber } from "@/lib/format";
import { AXIS_STYLE, GRID_STROKE, isMultiDay } from "./chart-utils";

interface Point {
  t: number;
  rate: number;
  total: number;
}

interface RainfallChartProps {
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
        Rainfall intensity: <strong>{formatNumber(p.rate, 1)} mm/hr</strong>
      </p>
      <p>Total since midnight: {formatNumber(p.total, 1)} mm</p>
    </div>
  );
}

/** Rainfall intensity bars with the Watch intensity threshold. */
export const RainfallChart = memo(function RainfallChart({ readings, thresholds, range }: RainfallChartProps) {
  const data = useMemo<Point[]>(
    () => readings.map((r) => ({ t: Date.parse(r.timestampUtc), rate: r.rainfallRateMmHr, total: r.rainfallTotalMm })),
    [readings],
  );
  const peak = useMemo(() => data.reduce((m, d) => Math.max(m, d.rate), 0), [data]);
  const yMax = Math.ceil(Math.max(thresholds.rainfallWatchThresholdMmHr * 1.5, peak * 1.1) / 10) * 10;
  const multiDay = isMultiDay(range);

  return (
    <figure className="space-y-3">
      <div className="h-52 w-full sm:h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap={0}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => formatAxisTime(v, multiDay)}
              tick={AXIS_STYLE}
              minTickGap={48}
              padding={{ left: 4, right: 4 }}
            />
            <YAxis domain={[0, yMax]} tick={AXIS_STYLE} width={44} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(205 60% 94%)" }} />
            <ReferenceLine
              y={thresholds.rainfallWatchThresholdMmHr}
              stroke={RISK_META.WATCH.hex}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `Watch ${thresholds.rainfallWatchThresholdMmHr} mm/hr`, position: "insideTopLeft", fill: RISK_META.WATCH.hex, fontSize: 11, fontWeight: 600 }}
            />
            <Bar dataKey="rate" fill="#0284c7" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="space-y-2 text-xs text-muted-foreground">
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Chart legend">
          <li className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[#0284c7]" aria-hidden="true" /> Rainfall intensity (mm/hr)
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: RISK_META.WATCH.hex }} aria-hidden="true" />
            Watch intensity: sustained for 15 min puts the site on Watch
          </li>
        </ul>
        <p className="sr-only" data-testid="rain-chart-summary">
          {data.length
            ? `Peak rainfall intensity ${formatNumber(peak, 1)} mm/hr. Watch threshold ${thresholds.rainfallWatchThresholdMmHr} mm/hr.`
            : "No rainfall readings in this period."}
        </p>
      </figcaption>
    </figure>
  );
});
