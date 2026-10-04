"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSiteOverviews } from "@/lib/hooks/queries";
import { sortByUrgency } from "@/components/overview/overview-dashboard";
import { RiskBadge, NodeStatusBadge } from "@/components/status/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

/** Hero card: every sensor's live status at a glance. */
export function LiveStatusCard() {
  const { data, isPending } = useSiteOverviews();
  const sites = data ? [...data].sort(sortByUrgency) : [];
  const warnings = sites.filter((s) => s.riskStatus === "WARNING").length;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/95 p-5 text-foreground shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-lagoon-500" />
            <span className="relative inline-flex size-2.5 rounded-full bg-lagoon-600" />
          </span>
          Live in Accra now
        </p>
        <span className="text-xs text-muted-foreground">Updates every 30 s</span>
      </div>
      {warnings > 0 && (
        <p className="mb-3 rounded-lg bg-status-warning-bg px-3 py-2 text-xs font-semibold text-status-warning">
          {warnings} area{warnings === 1 ? " is" : "s are"} on Warning right now.
        </p>
      )}
      <ul className="divide-y" aria-label="Live site status">
        {isPending
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="py-2.5">
                <Skeleton className="h-7" />
              </li>
            ))
          : sites.map(({ site, riskStatus, latestReading }) => (
              <li key={site.siteId}>
                <Link href={`/sites/${site.siteId}`} className="flex items-center justify-between gap-3 rounded-md py-2.5 hover:bg-muted/60">
                  <span className="min-w-0">
                    <span className="block font-semibold">{site.siteName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {latestReading ? `Water ${formatNumber(latestReading.waterLevelCm)} cm · Rain ${formatNumber(latestReading.rainfallRateMmHr, 1)} mm/hr` : "No data yet"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <RiskBadge status={riskStatus} size="sm" />
                    {site.status !== "ONLINE" && <NodeStatusBadge status={site.status} />}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
      <Link
        href="/dashboard"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
      >
        Open the live dashboard <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
