import type { AlertEvent, SensorReading, SiteOverview } from "@/types";
import { DEFAULT_THRESHOLDS } from "@/lib/constants/thresholds";

export function reading(overrides: Partial<SensorReading> = {}): SensorReading {
  return {
    readingId: "AQL-N01-20261004T1000",
    nodeId: "AQL-N01",
    siteId: "alajo",
    timestampUtc: "2026-10-04T10:00:00.000Z",
    receivedAtUtc: "2026-10-04T10:00:03.000Z",
    waterDistanceCm: 160,
    referenceDistanceCm: 320,
    waterLevelCm: 160,
    rainGaugePulseCount: 5,
    rainfallIncrementMm: 1,
    rainfallTotalMm: 42.6,
    rainfallRateMmHr: 12,
    riseRateCmMin: 1.2,
    batteryVoltageV: 3.95,
    signalStrength: -85,
    transmissionStatus: "OK",
    dataValidity: "VALID",
    ...overrides,
  };
}

export function overview(overrides: Partial<SiteOverview> = {}): SiteOverview {
  return {
    site: {
      siteId: "alajo",
      siteName: "Alajo",
      latitude: 5.6,
      longitude: -0.22,
      nodeId: "AQL-N01",
      status: "ONLINE",
      description: "Odaw River channel",
    },
    latestReading: reading(),
    riskStatus: "WARNING",
    lastAlert: null,
    thresholds: DEFAULT_THRESHOLDS,
    ...overrides,
  };
}

export function alert(overrides: Partial<AlertEvent> = {}): AlertEvent {
  return {
    alertId: "ALT-ALA-20261004T1000",
    siteId: "alajo",
    alertStatus: "WARNING",
    previousAlertStatus: "WATCH",
    triggerReason: "Water level 153 cm is above the 150 cm danger line and rising 1.2 cm/min",
    alertCreatedAtUtc: "2026-10-04T10:00:03.000Z",
    triggerWaterLevelCm: 153,
    triggerRainfallRateMmHr: 60,
    triggerRiseRateCmMin: 1.2,
    ...DEFAULT_THRESHOLDS,
    ...overrides,
  };
}
