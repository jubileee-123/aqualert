/**
 * Shared types for the AquaLert dashboard.
 * Field names follow the AquaLert data dictionary so the mock API can be
 * replaced by the real backend without remapping.
 */

export type NodeStatus = "ONLINE" | "OFFLINE" | "STALE";
export type AlertStatus = "NORMAL" | "WATCH" | "WARNING";
export type TransmissionStatus = "OK" | "DELAYED" | "RETRIED";
export type DataValidity = "VALID" | "SUSPECT" | "INVALID";
export type NotificationChannel = "SMS" | "WHATSAPP" | "DASHBOARD";
export type RecipientGroup = "RESIDENTS" | "LEADERS" | "NADMO" | "PUBLIC";
export type NotificationStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";

export interface Site {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  nodeId: string;
  /** Derived from the time of the node's last transmission. */
  status: NodeStatus;
  /** Free-text context shown on the detail page (drain/channel monitored). */
  description: string;
}

export interface SensorReading {
  readingId: string;
  nodeId: string;
  siteId: string;
  /** Time the node took the measurement (ISO 8601, UTC). */
  timestampUtc: string;
  /** Time the backend received the packet (ISO 8601, UTC). */
  receivedAtUtc: string;
  /** Ultrasonic sensor distance to the water surface. */
  waterDistanceCm: number;
  /** Sensor mounting height above the channel bed (dry distance). */
  referenceDistanceCm: number;
  /** referenceDistanceCm - waterDistanceCm. */
  waterLevelCm: number;
  rainGaugePulseCount: number;
  rainfallIncrementMm: number;
  /** Accumulated rainfall since 00:00 UTC (Accra local midnight). */
  rainfallTotalMm: number;
  rainfallRateMmHr: number;
  riseRateCmMin: number;
  batteryVoltageV: number;
  /** Received signal strength in dBm. */
  signalStrength: number;
  transmissionStatus: TransmissionStatus;
  dataValidity: DataValidity;
}

export interface AlertThresholds {
  waterWatchThresholdCm: number;
  waterWarningThresholdCm: number;
  rainfallWatchThresholdMmHr: number;
  riseWarningThresholdCmMin: number;
}

export interface AlertEvent extends AlertThresholds {
  alertId: string;
  siteId: string;
  alertStatus: AlertStatus;
  previousAlertStatus: AlertStatus | null;
  triggerReason: string;
  alertCreatedAtUtc: string;
  /** Reading values at the moment the status changed. */
  triggerWaterLevelCm: number;
  triggerRainfallRateMmHr: number;
  triggerRiseRateCmMin: number;
}

export interface NotificationLog {
  notificationId: string;
  alertId: string;
  channel: NotificationChannel;
  recipientGroup: RecipientGroup;
  sentAtUtc: string;
  notificationStatus: NotificationStatus;
  messageText: string;
  /** Message id returned by the SMS/WhatsApp gateway; null for dashboard posts. */
  providerReference: string | null;
  /** Number of recipients in the group at send time. */
  recipientCount: number;
}

/** Relative windows used by charts and filters. */
export type TimeRange = "1h" | "6h" | "24h" | "7d" | "today";

/** Absolute window, e.g. from the alerts date pickers. */
export interface TimeWindow {
  fromUtc: string;
  toUtc: string;
}

export type TimeRangeInput = TimeRange | TimeWindow;

/** One row of the overview: a site joined with its latest reading and current risk. */
export interface SiteOverview {
  site: Site;
  latestReading: SensorReading | null;
  /** Last known risk status from the alert engine. */
  riskStatus: AlertStatus;
  lastAlert: AlertEvent | null;
  thresholds: AlertThresholds;
}
