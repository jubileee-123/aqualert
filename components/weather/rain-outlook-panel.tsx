"use client";

import Link from "next/link";
import { CloudOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceTag } from "@/components/weather/data-source-note";
import { SITE_CONFIGS } from "@/lib/constants/sites";
import { getThresholds } from "@/lib/constants/thresholds";
import { useSiteRainOutlooks } from "@/lib/hooks/queries";
import { formatDayHour, formatNumber, formatTime } from "@/lib/format";
import { describeRain } from "@/lib/forecast";
import { cn } from "@/lib/utils";

/** Overview card: real rain now and the forecast at every monitoring site. */
export function RainOutlookPanel() {
  const { data, isPending, isError, dataUpdatedAt } = useSiteRainOutlooks();

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            Rainfall and forecast <SourceTag kind="live" />
          </CardTitle>
          <CardDescription>
            Real weather-model data for each site from Open-Meteo
            {dataUpdatedAt ? `, fetched ${formatTime(dataUpdatedAt)} GMT` : ""}. Not a rain-gauge reading.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudOff className="size-4" aria-hidden="true" />
            The weather service could not be reached. It will try again shortly.
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Live rainfall and forecast by site</caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-2 pb-2 font-medium">Site</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Rain now</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Last 24 h</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Next 6 h</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Heaviest in next 48 h</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {SITE_CONFIGS.map((site) => {
                  const o = data?.[site.siteId];
                  const watch = getThresholds(site.siteId).rainfallWatchThresholdMmHr;
                  return (
                    <tr key={site.siteId}>
                      <th scope="row" className="px-2 py-2 text-left font-semibold">
                        <Link href={`/sites/${site.siteId}`} className="hover:underline">
                          {site.siteName}
                        </Link>
                      </th>
                      {isPending || !o ? (
                        <td colSpan={4} className="px-2 py-2">
                          <Skeleton className="h-5" />
                        </td>
                      ) : (
                        <>
                          <td className="px-2 py-2 tabular-nums">
                            {o.nowMmHr < 0.1 ? "Dry" : `${formatNumber(o.nowMmHr, 1)} mm/hr`}
                          </td>
                          <td className="px-2 py-2 tabular-nums">{formatNumber(o.past24hMm, 1)} mm</td>
                          <td className="px-2 py-2 tabular-nums">{formatNumber(o.next6hMm, 1)} mm</td>
                          <td className="px-2 py-2">
                            {o.storm ? (
                              <span className={cn(o.storm.peakMmHr >= watch && "font-semibold text-status-watch")}>
                                {formatNumber(o.storm.peakMmHr, 1)} mm/hr ({describeRain(o.storm.peakMmHr)}) {formatDayHour(o.storm.peakTime)}
                                {o.storm.probability !== null && (
                                  <span className="text-muted-foreground"> · {o.storm.probability}% chance</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No rain expected</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
