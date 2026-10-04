"use client";

import { LayoutGrid, Map as MapIcon } from "lucide-react";
import type { Site } from "@/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/common/segmented";
import { useOverviewFilters, type OverviewTimeRange } from "@/lib/store/overview-filters";

export const OVERVIEW_RANGES: { value: OverviewTimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
];

export function OverviewFilters({ sites }: { sites: Site[] }) {
  const { siteId, status, timeRange, view, setSiteId, setStatus, setTimeRange, setView, reset } = useOverviewFilters();
  const filtered = siteId !== "all" || status !== "all";

  return (
    <section aria-label="Filters" className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-end">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
        <div className="space-y-1.5">
          <Label htmlFor="filter-site">Site</Label>
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger id="filter-site">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.siteId} value={s.siteId}>
                  {s.siteName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger id="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="WATCH">Watch</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time range</span>
          <Segmented label="Time range" value={timeRange} options={OVERVIEW_RANGES} onChange={setTimeRange} />
        </div>
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: "grid", label: <><LayoutGrid aria-hidden="true" /> Grid</> },
            { value: "map", label: <><MapIcon aria-hidden="true" /> Map</> },
          ]}
        />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {view === "map" ? "Map view" : "Grid view"}
      </span>
    </section>
  );
}
