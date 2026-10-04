import type { AquaLertApi } from "./types";
import { ApiError } from "./types";
import type { TimeRangeInput } from "@/types";

/**
 * REST client for the AquaLert backend. Endpoints mirror the bundled
 * Next.js route handlers in app/api, so pointing NEXT_PUBLIC_API_BASE_URL at
 * the real backend is all that is needed once it implements the same routes.
 */
export function createHttpApi(baseUrl: string, fetchImpl: typeof fetch = fetch): AquaLertApi {
  const base = baseUrl.replace(/\/$/, "");

  async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) qs.set(k, v);
    const url = `${base}${path}${qs.size ? `?${qs.toString()}` : ""}`;
    const res = await fetchImpl(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (res.status === 404) return null as T;
    if (!res.ok) throw new ApiError(`Request to ${path} failed (${res.status})`, res.status);
    return (await res.json()) as T;
  }

  const rangeParams = (range?: TimeRangeInput) =>
    range === undefined
      ? {}
      : typeof range === "string"
        ? { range }
        : { from: range.fromUtc, to: range.toUtc };

  const enc = encodeURIComponent;

  return {
    getSites: () => get("/sites"),
    getSite: (siteId) => get(`/sites/${enc(siteId)}`),
    getLatestReadingsBySite: (siteId) => get(`/sites/${enc(siteId)}/readings/latest`),
    getReadingsTimeSeries: (siteId, range) => get(`/sites/${enc(siteId)}/readings`, rangeParams(range)),
    getAlertHistory: (siteId, range) => get("/alerts", { siteId, ...rangeParams(range) }),
    getAlertById: (alertId) => get(`/alerts/${enc(alertId)}`),
    getNotificationsByAlert: (alertId) => get(`/alerts/${enc(alertId)}/notifications`),
  };
}
