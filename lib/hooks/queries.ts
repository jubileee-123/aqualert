"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getThresholds } from "@/lib/constants/thresholds";
import { LIVE_REFETCH_MS } from "@/lib/constants/config";
import type { AlertEvent, SiteOverview, TimeRangeInput } from "@/types";
import { SITE_CONFIGS } from "@/lib/constants/sites";
import { fetchRainOutlooks, type GeoPoint, type RainOutlook } from "@/lib/weather/open-meteo";

/** Query key factory: one place to see what is cached and how to invalidate it. */
export const queryKeys = {
  all: ["aqualert"] as const,
  overview: () => [...queryKeys.all, "overview"] as const,
  sites: () => [...queryKeys.all, "sites"] as const,
  site: (siteId: string) => [...queryKeys.all, "site", siteId] as const,
  latestReading: (siteId: string) => [...queryKeys.all, "latest", siteId] as const,
  timeSeries: (siteId: string, range: TimeRangeInput) => [...queryKeys.all, "series", siteId, range] as const,
  alerts: (siteId?: string, range?: TimeRangeInput) => [...queryKeys.all, "alerts", siteId ?? "all", range ?? "all"] as const,
  alert: (alertId: string) => [...queryKeys.all, "alert", alertId] as const,
  notifications: (alertId: string) => [...queryKeys.all, "notifications", alertId] as const,
};

const live = { refetchInterval: LIVE_REFETCH_MS, refetchIntervalInBackground: false } as const;

/** Current risk = status of the most recent alert transition for the site. */
export function currentRisk(alertsNewestFirst: AlertEvent[], siteId: string): AlertEvent | null {
  return alertsNewestFirst.find((a) => a.siteId === siteId) ?? null;
}

export function useSiteOverviews() {
  return useQuery({
    queryKey: queryKeys.overview(),
    queryFn: async (): Promise<SiteOverview[]> => {
      const [sites, alerts] = await Promise.all([api.getSites(), api.getAlertHistory()]);
      const latest = await Promise.all(sites.map((s) => api.getLatestReadingsBySite(s.siteId)));
      return sites.map((site, i) => {
        const lastAlert = currentRisk(alerts, site.siteId);
        return {
          site,
          latestReading: latest[i] ?? null,
          riskStatus: lastAlert?.alertStatus ?? "NORMAL",
          lastAlert,
          thresholds: getThresholds(site.siteId),
        };
      });
    },
    ...live,
  });
}

export function useSites() {
  return useQuery({ queryKey: queryKeys.sites(), queryFn: () => api.getSites(), staleTime: 5 * 60_000 });
}

export function useSite(siteId: string) {
  return useQuery({ queryKey: queryKeys.site(siteId), queryFn: () => api.getSite(siteId), ...live });
}

export function useLatestReading(siteId: string) {
  return useQuery({
    queryKey: queryKeys.latestReading(siteId),
    queryFn: () => api.getLatestReadingsBySite(siteId),
    ...live,
  });
}

export function useTimeSeries(siteId: string, range: TimeRangeInput) {
  return useQuery({
    queryKey: queryKeys.timeSeries(siteId, range),
    queryFn: () => api.getReadingsTimeSeries(siteId, range),
    // Keep the old chart on screen while a new range loads.
    placeholderData: keepPreviousData,
    ...live,
  });
}

export function useAlertHistory(siteId?: string, range?: TimeRangeInput) {
  return useQuery({
    queryKey: queryKeys.alerts(siteId, range),
    queryFn: () => api.getAlertHistory(siteId, range),
    placeholderData: keepPreviousData,
    ...live,
  });
}

export function useAlert(alertId: string | null) {
  return useQuery({
    queryKey: queryKeys.alert(alertId ?? ""),
    queryFn: () => api.getAlertById(alertId ?? ""),
    enabled: !!alertId,
  });
}

export function useNotifications(alertId: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications(alertId ?? ""),
    queryFn: () => api.getNotificationsByAlert(alertId ?? ""),
    enabled: !!alertId,
    ...live,
  });
}

const RAIN_REFETCH_MS = 15 * 60_000;
const rain = { staleTime: 10 * 60_000, refetchInterval: RAIN_REFETCH_MS, retry: 1 } as const;

/** Live rain outlook (Open-Meteo) at every monitoring site, keyed by site ID. */
export function useSiteRainOutlooks() {
  return useQuery({
    queryKey: [...queryKeys.all, "rain", "sites"],
    queryFn: async ({ signal }) => {
      const outlooks = await fetchRainOutlooks(SITE_CONFIGS, signal);
      return Object.fromEntries(SITE_CONFIGS.map((s, i) => [s.siteId, outlooks[i]!])) as Record<string, RainOutlook>;
    },
    ...rain,
  });
}

/** Live rain outlook (Open-Meteo) at one location, e.g. the place picked in the flood checker. */
export function useRainOutlook(point: GeoPoint | null) {
  return useQuery({
    queryKey: [...queryKeys.all, "rain", point?.latitude.toFixed(3), point?.longitude.toFixed(3)],
    queryFn: async ({ signal }) => (await fetchRainOutlooks([point!], signal))[0]!,
    enabled: !!point,
    ...rain,
  });
}
