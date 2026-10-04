import type {
  AlertEvent,
  NotificationChannel,
  NotificationLog,
  NotificationStatus,
  RecipientGroup,
  SensorReading,
  Site,
} from "@/types";
import { SITE_CONFIGS, type SiteConfig } from "@/lib/constants/sites";
import { getThresholds } from "@/lib/constants/thresholds";
import { deriveNodeStatus, deriveStatusTransitions } from "@/lib/alert-logic";
import { MINUTE_MS } from "@/lib/time";
import { alignToStep, generateSiteSeries } from "./generator";
import { SCENARIOS } from "./scenarios";

/**
 * In-memory "database" built from the scenarios. Readings, alerts and
 * notification logs are all derived from the same simulated series, so the
 * charts, alert history and notification trail are always consistent.
 */
export interface MockSnapshot {
  nowMs: number;
  sites: Site[];
  readingsBySite: Map<string, SensorReading[]>;
  alerts: AlertEvent[];
  notificationsByAlert: Map<string, NotificationLog[]>;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const compactTime = (iso: string) => iso.replace(/[-:]/g, "").slice(0, 13);

function alertMessage(alert: AlertEvent, siteName: string): string {
  const level = Math.round(alert.triggerWaterLevelCm);
  switch (alert.alertStatus) {
    case "WARNING":
      return `AquaLert WARNING - ${siteName}: water level ${level} cm and rising fast (${alert.triggerRiseRateCmMin.toFixed(1)} cm/min). Flooding is likely. Move people and valuables to higher ground now and avoid drains and flooded roads. Emergency: 112.`;
    case "WATCH":
      return `AquaLert WATCH - ${siteName}: water is rising (${level} cm, rain ${Math.round(alert.triggerRainfallRateMmHr)} mm/hr). Stay alert, keep drains clear, raise valuables and be ready to move if a Warning follows.`;
    case "NORMAL":
      return `AquaLert ALL CLEAR - ${siteName}: water levels are back to normal (${level} cm). Stay cautious near drains and report blockages to your assembly.`;
  }
}

interface Recipient {
  channel: NotificationChannel;
  group: RecipientGroup;
  count: number;
}

/** Who gets told what. Every Warning reaches residents by SMS and leaders/NADMO by SMS and WhatsApp. */
const DISPATCH_PLAN: Record<AlertEvent["alertStatus"], Recipient[]> = {
  WARNING: [
    { channel: "SMS", group: "RESIDENTS", count: 1240 },
    { channel: "SMS", group: "LEADERS", count: 18 },
    { channel: "WHATSAPP", group: "LEADERS", count: 18 },
    { channel: "SMS", group: "NADMO", count: 6 },
    { channel: "WHATSAPP", group: "NADMO", count: 6 },
    { channel: "DASHBOARD", group: "PUBLIC", count: 1 },
  ],
  WATCH: [
    { channel: "WHATSAPP", group: "LEADERS", count: 18 },
    { channel: "SMS", group: "NADMO", count: 6 },
    { channel: "DASHBOARD", group: "PUBLIC", count: 1 },
  ],
  NORMAL: [
    { channel: "WHATSAPP", group: "LEADERS", count: 18 },
    { channel: "DASHBOARD", group: "PUBLIC", count: 1 },
  ],
};

function buildNotifications(alert: AlertEvent, siteName: string, nowMs: number): NotificationLog[] {
  const createdMs = Date.parse(alert.alertCreatedAtUtc);
  const ageMin = (nowMs - createdMs) / MINUTE_MS;
  const text = alertMessage(alert, siteName);
  const logs: NotificationLog[] = [];

  DISPATCH_PLAN[alert.alertStatus].forEach((r, idx) => {
    const h = hash(`${alert.alertId}:${idx}`);
    const sentMs = createdMs + (8 + idx * 4 + (h % 9)) * 1000;
    const base = {
      alertId: alert.alertId,
      channel: r.channel,
      recipientGroup: r.group,
      messageText: text,
      recipientCount: r.count,
    };
    const ref = (prefix: string, n: number) =>
      r.channel === "DASHBOARD" ? null : `${prefix}-${n.toString(16).toUpperCase().padStart(8, "0").slice(0, 10)}`;
    const gateway = r.channel === "SMS" ? "SMSGW" : "WAMID";

    let status: NotificationStatus;
    if (r.channel === "DASHBOARD") status = "DELIVERED";
    else if (ageMin < 1) status = "QUEUED";
    else if (ageMin < 3) status = "SENT";
    else status = "DELIVERED";

    // About 1 in 6 gateway sends fail first time and are retried a minute later.
    const failedFirst = r.channel !== "DASHBOARD" && h % 6 === 0 && ageMin >= 1;
    if (failedFirst) {
      logs.push({
        ...base,
        notificationId: `NTF-${compactTime(alert.alertCreatedAtUtc)}-${alert.siteId.toUpperCase()}-${idx}A`,
        sentAtUtc: new Date(sentMs).toISOString(),
        notificationStatus: "FAILED",
        providerReference: ref(gateway, h),
      });
      logs.push({
        ...base,
        notificationId: `NTF-${compactTime(alert.alertCreatedAtUtc)}-${alert.siteId.toUpperCase()}-${idx}B`,
        sentAtUtc: new Date(sentMs + 60_000).toISOString(),
        notificationStatus: ageMin < 4 ? "SENT" : "DELIVERED",
        providerReference: ref(gateway, hash(`${h}retry`)),
      });
      return;
    }
    logs.push({
      ...base,
      notificationId: `NTF-${compactTime(alert.alertCreatedAtUtc)}-${alert.siteId.toUpperCase()}-${idx}`,
      sentAtUtc: new Date(sentMs).toISOString(),
      notificationStatus: status,
      providerReference: ref(gateway, h),
    });
  });
  return logs;
}

function buildSite(config: SiteConfig, readings: SensorReading[], nowMs: number): Site {
  const last = readings.at(-1);
  return {
    siteId: config.siteId,
    siteName: config.siteName,
    latitude: config.latitude,
    longitude: config.longitude,
    nodeId: config.nodeId,
    description: config.description,
    status: deriveNodeStatus(last?.timestampUtc ?? null, nowMs),
  };
}

export function buildSnapshot(anchorMs: number, nowMs: number): MockSnapshot {
  const readingsBySite = new Map<string, SensorReading[]>();
  const sites: Site[] = [];
  const alerts: AlertEvent[] = [];
  const notificationsByAlert = new Map<string, NotificationLog[]>();

  for (const config of SITE_CONFIGS) {
    const scenario = SCENARIOS.find((s) => s.siteId === config.siteId);
    if (!scenario) continue;
    const { readings } = generateSiteSeries(config, scenario, anchorMs, nowMs);
    readingsBySite.set(config.siteId, readings);
    sites.push(buildSite(config, readings, nowMs));

    const thresholds = getThresholds(config.siteId);
    const { transitions } = deriveStatusTransitions(readings, thresholds);
    for (const tr of transitions) {
      const alert: AlertEvent = {
        alertId: `ALT-${config.siteId.slice(0, 3).toUpperCase()}-${compactTime(tr.reading.timestampUtc)}`,
        siteId: config.siteId,
        alertStatus: tr.to,
        previousAlertStatus: tr.from,
        triggerReason: tr.reason,
        // The engine raises the alert once the packet arrives.
        alertCreatedAtUtc: tr.reading.receivedAtUtc,
        triggerWaterLevelCm: tr.reading.waterLevelCm,
        triggerRainfallRateMmHr: tr.reading.rainfallRateMmHr,
        triggerRiseRateCmMin: tr.reading.riseRateCmMin,
        ...thresholds,
      };
      alerts.push(alert);
      notificationsByAlert.set(alert.alertId, buildNotifications(alert, config.siteName, nowMs));
    }
  }

  alerts.sort((a, b) => b.alertCreatedAtUtc.localeCompare(a.alertCreatedAtUtc));
  return { nowMs, sites, readingsBySite, alerts, notificationsByAlert };
}

/**
 * Process-wide mock clock. The anchor is fixed when the module loads, so IDs
 * and storm timings stay stable while the app runs; new readings keep
 * arriving every 5 minutes as real time advances.
 */
let anchorMs = alignToStep(Date.now());
let cached: MockSnapshot | null = null;

export function getSnapshot(nowMs: number = Date.now()): MockSnapshot {
  const aligned = alignToStep(nowMs);
  if (!cached || cached.nowMs !== aligned) cached = buildSnapshot(anchorMs, aligned);
  return cached;
}

/** Test hook: pin the scenario to a fixed anchor time. */
export function resetMockClock(anchor: number): void {
  anchorMs = alignToStep(anchor);
  cached = null;
}
