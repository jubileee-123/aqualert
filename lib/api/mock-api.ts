import type { AquaLertApi } from "./types";
import type { SensorReading } from "@/types";
import { getSnapshot } from "./mock/database";
import { resolveTimeRange } from "@/lib/time";

/** Keep chart payloads small: at most this many points per series. */
const MAX_POINTS = 400;

function thin(readings: SensorReading[]): SensorReading[] {
  if (readings.length <= MAX_POINTS) return readings;
  const stride = Math.ceil(readings.length / MAX_POINTS);
  // Keep the latest reading so the chart always ends at "now".
  return readings.filter((_, i) => (readings.length - 1 - i) % stride === 0);
}

export interface MockApiOptions {
  /** Simulated network latency in ms (0 in tests). */
  latencyMs?: number;
  /** Clock override for deterministic tests. */
  now?: () => number;
}

export function createMockApi({ latencyMs = 250, now = Date.now }: MockApiOptions = {}): AquaLertApi {
  const respond = async <T>(produce: () => T): Promise<T> => {
    if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs * (0.6 + Math.random() * 0.8)));
    // structuredClone so callers can never mutate the mock store.
    return structuredClone(produce());
  };

  return {
    getSites: () => respond(() => getSnapshot(now()).sites),

    getSite: (siteId) => respond(() => getSnapshot(now()).sites.find((s) => s.siteId === siteId) ?? null),

    getLatestReadingsBySite: (siteId) =>
      respond(() => getSnapshot(now()).readingsBySite.get(siteId)?.at(-1) ?? null),

    getReadingsTimeSeries: (siteId, timeRange) =>
      respond(() => {
        const snap = getSnapshot(now());
        const { fromMs, toMs } = resolveTimeRange(timeRange, snap.nowMs);
        const all = snap.readingsBySite.get(siteId) ?? [];
        return thin(
          all.filter((r) => {
            const t = Date.parse(r.timestampUtc);
            return t >= fromMs && t <= toMs;
          }),
        );
      }),

    getAlertHistory: (siteId, timeRange) =>
      respond(() => {
        const snap = getSnapshot(now());
        const window = timeRange ? resolveTimeRange(timeRange, snap.nowMs) : null;
        return snap.alerts.filter((a) => {
          if (siteId && a.siteId !== siteId) return false;
          if (window) {
            const t = Date.parse(a.alertCreatedAtUtc);
            if (t < window.fromMs || t > window.toMs) return false;
          }
          return true;
        });
      }),

    getAlertById: (alertId) =>
      respond(() => getSnapshot(now()).alerts.find((a) => a.alertId === alertId) ?? null),

    getNotificationsByAlert: (alertId) =>
      respond(() => getSnapshot(now()).notificationsByAlert.get(alertId) ?? []),
  };
}
