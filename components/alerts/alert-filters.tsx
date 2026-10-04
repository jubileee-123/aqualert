"use client";

import { Search } from "lucide-react";
import type { AlertStatus, Site } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Segmented } from "@/components/common/segmented";

export type AlertRangePreset = "24h" | "7d" | "custom";
export type LevelFilter = AlertStatus | "all";

export interface AlertFilterState {
  siteId: string;
  level: LevelFilter;
  preset: AlertRangePreset;
  /** datetime-local values, interpreted as UTC (Accra local time). */
  from: string;
  to: string;
  query: string;
}

interface Props {
  value: AlertFilterState;
  sites: Site[];
  onChange: (next: AlertFilterState) => void;
  onReset: () => void;
}

export function AlertFilters({ value, sites, onChange, onReset }: Props) {
  const set = <K extends keyof AlertFilterState>(k: K, v: AlertFilterState[K]) => onChange({ ...value, [k]: v });

  return (
    <section aria-label="Alert filters" className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="alert-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="alert-search"
              type="search"
              placeholder="Alert ID or site name"
              value={value.query}
              onChange={(e) => set("query", e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alert-site">Site</Label>
          <Select value={value.siteId} onValueChange={(v) => set("siteId", v)}>
            <SelectTrigger id="alert-site">
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
          <Label htmlFor="alert-level">Alert level</Label>
          <Select value={value.level} onValueChange={(v) => set("level", v as LevelFilter)}>
            <SelectTrigger id="alert-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="WATCH">Watch</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="NORMAL">All clear</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Period</span>
          <Segmented
            label="Period"
            value={value.preset}
            onChange={(v) => set("preset", v)}
            options={[
              { value: "24h", label: "24h" },
              { value: "7d", label: "7 days" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
      </div>
      {value.preset === "custom" && (
        <fieldset className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <legend className="sr-only">Custom date and time range (GMT)</legend>
          <div className="space-y-1.5">
            <Label htmlFor="alert-from">From (GMT)</Label>
            <Input id="alert-from" type="datetime-local" value={value.from} max={value.to} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alert-to">To (GMT)</Label>
            <Input id="alert-to" type="datetime-local" value={value.to} min={value.from} onChange={(e) => set("to", e.target.value)} />
          </div>
        </fieldset>
      )}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </section>
  );
}
