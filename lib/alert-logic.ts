import type { AlertStatus, AlertThresholds, NodeStatus, SensorReading } from "@/types";
import { ALERT_TIMING } from "@/lib/constants/thresholds";

/**
 * Client-side representation of the AquaLert decision rules. The backend
 * engine is authoritative; this mirrors it so the mock data, charts and
 * legends all agree on what Normal / Watch / Warning mean.
 *
 *  - WARNING: water level >= danger threshold AND rise rate >= rapid-rise threshold.
 *             Once raised, Warning holds while the level stays near the danger line,
 *             even if the rise slows (the channel is still dangerously full).
 *  - WATCH:   water level >= watch threshold, OR rainfall >= watch intensity
 *             sustained for the confirmation period.
 *  - NORMAL:  everything below thresholds. On the way down, levels must fall a
 *             few cm below the line and rain must stay light for the confirmation
 *             period, so a single quiet reading does not flap the status.
 */

export interface EvaluationContext {
  previousStatus: AlertStatus;
  /** Consecutive valid readings with rainfall at or above the Watch intensity, including this one. */
  heavyRainReadings: number;
  /** Consecutive valid readings with rainfall below the Watch intensity, including this one. */
  lightRainReadings: number;
}

export interface Evaluation {
  status: AlertStatus;
  reason: string;
}

type Timing = Pick<
  typeof ALERT_TIMING,
  "readingIntervalMinutes" | "watchConfirmationMinutes" | "clearHysteresisCm"
>;

const fmt = (n: number, digits = 0) => n.toFixed(digits);

/** True when `readings` consecutive readings span at least the confirmation period. */
export function isConfirmed(readings: number, timing: Timing = ALERT_TIMING): boolean {
  return readings * timing.readingIntervalMinutes >= timing.watchConfirmationMinutes;
}

export function evaluateReading(
  reading: Pick<SensorReading, "waterLevelCm" | "riseRateCmMin" | "rainfallRateMmHr">,
  t: AlertThresholds,
  ctx: EvaluationContext,
  timing: Timing = ALERT_TIMING,
): Evaluation {
  const { waterLevelCm: level, riseRateCmMin: rise, rainfallRateMmHr: rain } = reading;
  const h = timing.clearHysteresisCm;

  const rapidRiseAboveDanger =
    level >= t.waterWarningThresholdCm && rise >= t.riseWarningThresholdCmMin;
  if (rapidRiseAboveDanger) {
    return {
      status: "WARNING",
      reason: `Water level ${fmt(level)} cm is above the ${t.waterWarningThresholdCm} cm danger line and rising ${fmt(rise, 2)} cm/min (rapid-rise limit ${t.riseWarningThresholdCmMin} cm/min)`,
    };
  }
  // Latch: stay on Warning until the level drops clearly below the danger line.
  if (ctx.previousStatus === "WARNING" && level >= t.waterWarningThresholdCm - h) {
    return { status: "WARNING", reason: `Water level ${fmt(level)} cm remains at the danger line` };
  }

  const reasons: string[] = [];
  const watchLevel =
    ctx.previousStatus === "NORMAL" ? t.waterWatchThresholdCm : t.waterWatchThresholdCm - h;
  if (level >= watchLevel) {
    reasons.push(`Water level ${fmt(level)} cm is above the ${t.waterWatchThresholdCm} cm watch line`);
  }
  if (rain >= t.rainfallWatchThresholdMmHr && isConfirmed(ctx.heavyRainReadings, timing)) {
    reasons.push(
      `Rainfall ${fmt(rain)} mm/hr has stayed above ${t.rainfallWatchThresholdMmHr} mm/hr for ${timing.watchConfirmationMinutes}+ min`,
    );
  } else if (ctx.previousStatus !== "NORMAL" && !isConfirmed(ctx.lightRainReadings, timing)) {
    // Rain-driven Watch is only lifted once rain has eased for the full confirmation period.
    reasons.push(`Heavy rain eased less than ${timing.watchConfirmationMinutes} min ago`);
  }
  if (reasons.length > 0) {
    const prefix = ctx.previousStatus === "WARNING" ? "Level fell below the danger line. " : "";
    return { status: "WATCH", reason: prefix + reasons.join("; ") };
  }

  return {
    status: "NORMAL",
    reason: `All clear: water level ${fmt(level)} cm and rainfall ${fmt(rain)} mm/hr are below thresholds`,
  };
}

export interface StatusTransition {
  reading: SensorReading;
  from: AlertStatus;
  to: AlertStatus;
  reason: string;
}

/**
 * Walks a chronological series and returns every status change, the way the
 * backend engine would raise alerts. Readings flagged SUSPECT/INVALID are ignored.
 */
export function deriveStatusTransitions(
  readings: SensorReading[],
  t: AlertThresholds,
  timing: Timing = ALERT_TIMING,
  initialStatus: AlertStatus = "NORMAL",
): { transitions: StatusTransition[]; finalStatus: AlertStatus } {
  let status = initialStatus;
  let heavyRain = 0;
  let lightRain = 0;
  const transitions: StatusTransition[] = [];
  for (const r of readings) {
    if (r.dataValidity !== "VALID") continue;
    const heavy = r.rainfallRateMmHr >= t.rainfallWatchThresholdMmHr;
    heavyRain = heavy ? heavyRain + 1 : 0;
    lightRain = heavy ? 0 : lightRain + 1;
    const next = evaluateReading(
      r,
      t,
      { previousStatus: status, heavyRainReadings: heavyRain, lightRainReadings: lightRain },
      timing,
    );
    if (next.status !== status) {
      transitions.push({ reading: r, from: status, to: next.status, reason: next.reason });
      status = next.status;
    }
  }
  return { transitions, finalStatus: status };
}

/** Node health from the age of its last transmission. */
export function deriveNodeStatus(
  lastReadingUtc: string | null,
  nowMs: number,
  timing: Pick<typeof ALERT_TIMING, "staleAfterMinutes" | "offlineAfterMinutes"> = ALERT_TIMING,
): NodeStatus {
  if (!lastReadingUtc) return "OFFLINE";
  const ageMin = (nowMs - Date.parse(lastReadingUtc)) / 60_000;
  if (ageMin >= timing.offlineAfterMinutes) return "OFFLINE";
  if (ageMin >= timing.staleAfterMinutes) return "STALE";
  return "ONLINE";
}
