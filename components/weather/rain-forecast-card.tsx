"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { CloudOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceTag } from "@/components/weather/data-source-note";
import { useSiteRainOutlooks } from "@/lib/hooks/queries";
import { formatDayHour, formatNumber } from "@/lib/format";
import { describeRain } from "@/lib/forecast";
import { RISK_META } from "@/lib/status";
import { LAGOON, SAND } from "@/lib/theme";
import { AXIS_STYLE, GRID_STROKE } from "@/components/site/chart-utils";

interface Point {
  t: number;
  mm: number;
  probability: number | null;
  past: boolean;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const p = payload?.[0]?.payload as Point | undefined;
  if (!active || !p) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">
        Hour to {formatDayHour(p.t)} GMT {p.past ? "(estimated)" : "(forecast)"}
      </p>
      <p>
        Rain: <strong>{formatNumber(p.mm, 1)} mm</strong> ({describeRain(p.mm)})
      </p>
      {!p.past && p.probability !== null && <p>Chance of rain: {p.probability}%</p>}
    </div>
  );
}

/** Site page: real hourly rain for the past day and the next two days at this site. */
export function RainForecastCard({ siteId, siteName, watchMmHr }: { siteId: string; siteName: string; watchMmHr: number }) {
  const { data, isPending, isError } = useSiteRainOutlooks();
  const o = data?.[siteId];
  const points = useMemo<Point[]>(
    () =>
      o
        ? [
            ...o.past.map((h) => ({ t: h.time, mm: h.mm, probability: h.probability, past: true })),
            ...o.next.map((h) => ({ t: h.time, mm: h.mm, probability: h.probability, past: false })),
          ]
        : [],
    [o],
  );
  const peak = points.reduce((m, p) => Math.max(m, p.mm), 0);
  const yMax = Math.max(5, Math.ceil((peak * 1.2) / 5) * 5);
  const lastPast = o?.past.at(-1)?.time;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          Rain forecast at {siteName} <SourceTag kind="live" />
        </CardTitle>
        <CardDescription>
          Hourly rain from Open-Meteo weather models: the last 24 hours (estimated) and the next 48 hours (forecast).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudOff className="size-4" aria-hidden="true" /> The weather service could not be reached.
          </p>
        ) : isPending || !o ? (
          <Skeleton className="h-52" />
        ) : (
          <figure className="space-y-3">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Rain now</dt>
                <dd className="font-semibold">{o.nowMmHr < 0.1 ? "Dry" : `${formatNumber(o.nowMmHr, 1)} mm/hr`}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last 24 h</dt>
                <dd className="font-semibold">{formatNumber(o.past24hMm, 1)} mm</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Next 24 h</dt>
                <dd className="font-semibold">{formatNumber(o.next24hMm, 1)} mm</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Heaviest expected</dt>
                <dd className="font-semibold">
                  {o.storm ? `${formatNumber(o.storm.peakMmHr, 1)} mm/hr, ${formatDayHour(o.storm.peakTime)}` : "No rain expected"}
                </dd>
              </div>
            </dl>
            <div className="h-52 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap={1}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="t" type="category" tickFormatter={(v: number) => formatDayHour(v)} tick={AXIS_STYLE} minTickGap={40} />
                  <YAxis domain={[0, yMax]} tick={AXIS_STYLE} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: LAGOON[100] }} />
                  {watchMmHr <= yMax && (
                    <ReferenceLine y={watchMmHr} stroke={RISK_META.WATCH.hex} strokeDasharray="6 4" strokeWidth={1.5} />
                  )}
                  {lastPast !== undefined && <ReferenceLine x={lastPast} stroke={LAGOON[900]} strokeWidth={1.5} label={{ value: "Now", position: "insideTopRight", fontSize: 11, fill: LAGOON[900] }} />}
                  <Bar dataKey="mm" isAnimationActive={false}>
                    {points.map((p) => (
                      <Cell key={p.t} fill={p.past ? SAND[400] : LAGOON[500]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-sm" style={{ background: SAND[400] }} aria-hidden="true" /> Past 24 h (model estimate)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-lagoon-500" aria-hidden="true" /> Next 48 h (forecast)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 border-t-2 border-dashed" style={{ borderColor: RISK_META.WATCH.hex }} aria-hidden="true" />
                Watch intensity {watchMmHr} mm/hr
              </span>
              <span className="sr-only">
                {o.storm
                  ? `Heaviest forecast rain ${formatNumber(o.storm.peakMmHr, 1)} millimetres per hour at ${formatDayHour(o.storm.peakTime)}.`
                  : "No rain expected in the next 48 hours."}
              </span>
            </figcaption>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}
