import type { SensorReading, TransmissionStatus, DataValidity } from "@/types";
import type { SiteConfig } from "@/lib/constants/sites";
import type { SiteScenario, StormEvent } from "./scenarios";
import { ALERT_TIMING } from "@/lib/constants/thresholds";
import { DAY_MS, MINUTE_MS } from "@/lib/time";

const STEP_MIN = ALERT_TIMING.readingIntervalMinutes;
const STEP_MS = STEP_MIN * MINUTE_MS;
/** Tipping-bucket rain gauge resolution. */
const MM_PER_PULSE = 0.2;
export const HISTORY_DAYS = 7;

/** Deterministic pseudo-random number in [0, 1) for a (seed, step) pair. */
function rand(seed: number, step: number, salt = 0): number {
  let t = (seed ^ Math.imul(step + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Storm intensity: quick ramp to the peak, then exponential-style decay (spike, then gradual decline). */
function stormRate(storm: StormEvent, minutesSinceStart: number): number {
  if (minutesSinceStart < 0 || minutesSinceStart > storm.durationMin) return 0;
  const peakMin = storm.durationMin * (storm.peakAt ?? 0.3);
  if (minutesSinceStart <= peakMin) return storm.peakMmHr * (minutesSinceStart / peakMin);
  const tail = (minutesSinceStart - peakMin) / (storm.durationMin - peakMin);
  return storm.peakMmHr * Math.exp(-3.2 * tail) * (1 - tail * 0.15);
}

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export interface GeneratedSeries {
  /** Readings the node actually transmitted (stops early for silent nodes). */
  readings: SensorReading[];
}

/**
 * Simulates one site's node from (anchor - 7 days) up to `nowMs`.
 * The water level follows a simple linear-reservoir model: rain adds level
 * through the catchment gain, and excess above dry-weather flow drains away
 * a fixed fraction each step. This gives fast rises in heavy rain and slow
 * recessions afterwards, with small sensor noise on top.
 */
export function generateSiteSeries(
  config: SiteConfig,
  scenario: SiteScenario,
  anchorMs: number,
  nowMs: number,
): GeneratedSeries {
  const seed = hashString(config.siteId);
  const startMs = anchorMs - HISTORY_DAYS * DAY_MS;
  const lastMs = nowMs - (scenario.silentForMin ?? 0) * MINUTE_MS;
  const steps = Math.floor((nowMs - startMs) / STEP_MS);

  const readings: SensorReading[] = [];
  let level = scenario.baseLevelCm;
  let prevMeasuredLevel = level;
  let dayTotalMm = 0;
  let currentDay = -1;

  for (let i = 0; i <= steps; i++) {
    const ts = startMs + i * STEP_MS;
    const minutesFromAnchor = (ts - anchorMs) / MINUTE_MS;

    // Rainfall: sum of active storms, with convective gustiness.
    let rainRate = 0;
    for (const storm of scenario.storms) {
      rainRate += stormRate(storm, minutesFromAnchor - storm.startOffsetMin);
    }
    if (rainRate > 0) rainRate *= 0.8 + 0.4 * rand(seed, i, 1);

    // Tipping-bucket quantisation: the gauge reports whole pulses.
    const pulses = Math.round((rainRate * STEP_MIN) / 60 / MM_PER_PULSE);
    const incrementMm = round(pulses * MM_PER_PULSE, 1);
    const day = Math.floor(ts / DAY_MS);
    if (day !== currentDay) {
      currentDay = day;
      dayTotalMm = 0;
    }
    dayTotalMm += incrementMm;
    const measuredRate = round((incrementMm * 60) / STEP_MIN, 1);

    // Linear reservoir water level model.
    level += scenario.catchmentGain * rainRate - scenario.recession * (level - scenario.baseLevelCm);
    const noise = (rand(seed, i, 2) - 0.5) * 2 * scenario.noiseCm;
    let measuredLevel = Math.max(0, level + noise);

    // ~0.7% of readings are ultrasonic echo spikes (debris, splashes) flagged SUSPECT.
    let dataValidity: DataValidity = "VALID";
    if (rand(seed, i, 3) < 0.007) {
      dataValidity = "SUSPECT";
      measuredLevel += 12 + 10 * rand(seed, i, 4);
    }

    const waterDistanceCm = round(config.referenceDistanceCm - measuredLevel, 1);
    const waterLevelCm = round(config.referenceDistanceCm - waterDistanceCm, 1);
    const riseRateCmMin =
      dataValidity === "VALID" ? round((waterLevelCm - prevMeasuredLevel) / STEP_MIN, 2) : 0;
    if (dataValidity === "VALID") prevMeasuredLevel = waterLevelCm;

    // Battery: solar charging during the day, optional long-term drain.
    const hourOfDay = (ts / 3_600_000) % 24;
    const solar = Math.max(0, Math.sin(((hourOfDay - 6) / 12) * Math.PI)) * 0.18;
    const daysElapsed = (ts - startMs) / DAY_MS;
    const battery =
      scenario.batteryBaseV + solar - (scenario.batteryDrainPerDay ?? 0) * daysElapsed - (rainRate > 0 ? 0.04 : 0);

    // Heavy rain degrades the radio link.
    const signal = scenario.signalBaseDbm - rainRate * 0.08 + (rand(seed, i, 5) - 0.5) * 6;

    const tx = rand(seed, i, 6);
    const transmissionStatus: TransmissionStatus = tx < 0.03 ? "RETRIED" : tx < 0.08 ? "DELAYED" : "OK";
    const latencyMs =
      transmissionStatus === "OK" ? 2_000 + tx * 4_000 : transmissionStatus === "DELAYED" ? 45_000 : 95_000;

    if (ts > lastMs) continue;
    readings.push({
      readingId: `${config.nodeId}-${new Date(ts).toISOString().replace(/[-:]/g, "").slice(0, 13)}`,
      nodeId: config.nodeId,
      siteId: config.siteId,
      timestampUtc: new Date(ts).toISOString(),
      receivedAtUtc: new Date(ts + latencyMs).toISOString(),
      waterDistanceCm,
      referenceDistanceCm: config.referenceDistanceCm,
      waterLevelCm,
      rainGaugePulseCount: pulses,
      rainfallIncrementMm: incrementMm,
      rainfallTotalMm: round(dayTotalMm, 1),
      rainfallRateMmHr: measuredRate,
      riseRateCmMin,
      batteryVoltageV: round(battery, 2),
      signalStrength: Math.round(signal),
      transmissionStatus,
      dataValidity,
    });
  }

  return { readings };
}

/** Aligns a timestamp down to the reading interval so generated timestamps are stable. */
export function alignToStep(ms: number): number {
  return Math.floor(ms / STEP_MS) * STEP_MS;
}
