import type { TimeRange, TimeRangeInput } from "@/types";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

const RANGE_MS: Record<Exclude<TimeRange, "today">, number> = {
  "1h": HOUR_MS,
  "6h": 6 * HOUR_MS,
  "24h": DAY_MS,
  "7d": 7 * DAY_MS,
};

export interface ResolvedWindow {
  fromMs: number;
  toMs: number;
}

/** Resolves a relative or absolute range into epoch milliseconds. "today" starts at 00:00 UTC (Accra local midnight). */
export function resolveTimeRange(range: TimeRangeInput, nowMs: number): ResolvedWindow {
  if (typeof range === "object") {
    return { fromMs: Date.parse(range.fromUtc), toMs: Date.parse(range.toUtc) };
  }
  if (range === "today") {
    const d = new Date(nowMs);
    return { fromMs: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), toMs: nowMs };
  }
  return { fromMs: nowMs - RANGE_MS[range], toMs: nowMs };
}

export function isTimeRange(value: string): value is TimeRange {
  return value === "today" || value in RANGE_MS;
}

export function minutesBetween(fromMs: number, toMs: number): number {
  return (toMs - fromMs) / MINUTE_MS;
}
