import type { AlertThresholds } from "@/types";

/**
 * Default alert thresholds. Every value is site-specific in production
 * (channel depth, bank height and local flood history differ), so sites can
 * override any field in SITE_THRESHOLD_OVERRIDES below.
 */
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  /** Water level that puts a site on Watch. */
  waterWatchThresholdCm: 80,
  /** "Danger" level: with rapid rise, puts a site on Warning. */
  waterWarningThresholdCm: 150,
  /** Rain intensity that, sustained for the confirmation period, puts a site on Watch. */
  rainfallWatchThresholdMmHr: 20,
  /** Rapid-rise rate that, above the danger level, puts a site on Warning. */
  riseWarningThresholdCmMin: 0.8,
};

export const SITE_THRESHOLD_OVERRIDES: Record<string, Partial<AlertThresholds>> = {
  // Weija sits below the reservoir spillway in a deeper channel.
  weija: { waterWatchThresholdCm: 110, waterWarningThresholdCm: 190 },
  // Kwame Nkrumah Circle drains overtop at a lower depth.
  circle: { waterWatchThresholdCm: 70, waterWarningThresholdCm: 130 },
};

export const ALERT_TIMING = {
  /** Nodes transmit one reading every 5 minutes. */
  readingIntervalMinutes: 5,
  /** Rainfall must stay above the Watch threshold this long before Watch is raised. */
  watchConfirmationMinutes: 15,
  /** A level must fall this far below a threshold before the status is lowered (prevents flapping). */
  clearHysteresisCm: 5,
  /** No reading for this long marks the node Stale. */
  staleAfterMinutes: 15,
  /** No reading for this long marks the node Offline. */
  offlineAfterMinutes: 60,
} as const;

export function getThresholds(siteId: string): AlertThresholds {
  return { ...DEFAULT_THRESHOLDS, ...SITE_THRESHOLD_OVERRIDES[siteId] };
}

/** Battery voltage below which the node health panel flags the battery. */
export const LOW_BATTERY_V = 3.5;
/** Signal strength (dBm) below which the link is considered weak. */
export const WEAK_SIGNAL_DBM = -100;
