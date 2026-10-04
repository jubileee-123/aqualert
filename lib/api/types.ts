import type { AlertEvent, NotificationLog, SensorReading, Site, TimeRangeInput } from "@/types";

/**
 * The contract every AquaLert data source implements. The UI only talks to
 * this interface, so swapping the mock for the real backend is a one-line
 * change in lib/api/index.ts (or the NEXT_PUBLIC_API_MODE env var).
 */
export interface AquaLertApi {
  getSites(): Promise<Site[]>;
  getSite(siteId: string): Promise<Site | null>;
  /** Most recent reading the node transmitted, or null if it never reported. */
  getLatestReadingsBySite(siteId: string): Promise<SensorReading | null>;
  /** Chronological readings for charts. Long ranges are thinned server-side. */
  getReadingsTimeSeries(siteId: string, timeRange: TimeRangeInput): Promise<SensorReading[]>;
  /** Alerts newest first, optionally limited to one site and/or a time window. */
  getAlertHistory(siteId?: string, timeRange?: TimeRangeInput): Promise<AlertEvent[]>;
  getAlertById(alertId: string): Promise<AlertEvent | null>;
  getNotificationsByAlert(alertId: string): Promise<NotificationLog[]>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
