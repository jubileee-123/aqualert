import type { AlertStatus, AlertThresholds } from "@/types";
import { SITE_CONFIGS, type SiteConfig } from "@/lib/constants/sites";
import { ALERT_TIMING, getThresholds } from "@/lib/constants/thresholds";
import { SCENARIOS, type SiteScenario } from "@/lib/api/mock/scenarios";
import { evaluateReading } from "@/lib/alert-logic";
import { RISK_META } from "@/lib/status";

/**
 * "What if it rains?" estimator for the landing page.
 *
 * 1. Find the AquaLert sensor for the person's location: the channel that
 *    drains their area if known, otherwise the nearest sensor.
 * 2. Run that channel's catchment model (the same linear-reservoir response
 *    the sensor data follows: rain raises the level, excess drains away each
 *    step) under constant rain of the chosen intensity and duration.
 * 3. Run the alert rules over the simulated levels to get the status the
 *    channel would reach.
 * 4. Scale the channel's rise by the area's exposure (low-lying vs high
 *    ground) and turn it into a likelihood of local flooding.
 *
 * This is a planning estimate, not a forecast. It ignores blocked drains,
 * tides and upstream rain, and should be recalibrated with real flood
 * records before anyone relies on it.
 */

export type Likelihood = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export interface LocationInput {
  name: string;
  latitude: number;
  longitude: number;
  /** Local exposure multiplier (1 = average). */
  exposureFactor: number;
  /** Sensor on the channel that drains this area, if not simply the nearest one. */
  channelSiteId?: string;
}

export interface ScenarioInput {
  rainMmHr: number;
  durationMin: number;
  /** Channel level to start from; defaults to the dry-weather level. */
  startLevelCm?: number;
}

export interface SimulationResult {
  peakLevelCm: number;
  maxRiseCmMin: number;
  /** Minutes after rain starts that each line is first reached (null if never). */
  minutesToWatch: number | null;
  minutesToDanger: number | null;
  /** Highest status the channel reaches under the alert rules. */
  status: AlertStatus;
}

export interface FloodEstimate extends SimulationResult {
  site: SiteConfig;
  distanceKm: number;
  confidence: Confidence;
  thresholds: AlertThresholds;
  startLevelCm: number;
  /** Peak level adjusted for the area's exposure. */
  localPeakCm: number;
  /** 0..1 */
  probability: number;
  likelihood: Likelihood;
  /** Lowest intensity (mm/hr) at which flooding becomes more likely than not for this duration, if any. */
  tippingPointMmHr: number | null;
}

const STEP_MIN = ALERT_TIMING.readingIntervalMinutes;
/** Keep simulating after the rain stops so delayed peaks are caught. */
const AFTER_RAIN_MIN = 90;

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** The sensor that represents a location: its draining channel if known, else the nearest sensor. */
export function siteForLocation(location: Pick<LocationInput, "latitude" | "longitude" | "channelSiteId">): {
  site: SiteConfig;
  distanceKm: number;
} {
  const channel = location.channelSiteId && SITE_CONFIGS.find((s) => s.siteId === location.channelSiteId);
  if (channel) {
    return { site: channel, distanceKm: haversineKm(location.latitude, location.longitude, channel.latitude, channel.longitude) };
  }
  return nearestSite(location.latitude, location.longitude);
}

export function nearestSite(latitude: number, longitude: number): { site: SiteConfig; distanceKm: number } {
  let best = { site: SITE_CONFIGS[0]!, distanceKm: Infinity };
  for (const site of SITE_CONFIGS) {
    const d = haversineKm(latitude, longitude, site.latitude, site.longitude);
    if (d < best.distanceKm) best = { site, distanceKm: d };
  }
  return best;
}

export function confidenceFor(distanceKm: number): Confidence {
  if (distanceKm <= 2.5) return "HIGH";
  if (distanceKm <= 6) return "MEDIUM";
  return "LOW";
}

function scenarioFor(siteId: string): SiteScenario {
  const s = SCENARIOS.find((x) => x.siteId === siteId);
  if (!s) throw new Error(`No catchment model for site ${siteId}`);
  return s;
}

export function simulateChannel(
  scenario: Pick<SiteScenario, "baseLevelCm" | "catchmentGain" | "recession">,
  thresholds: AlertThresholds,
  { rainMmHr, durationMin, startLevelCm }: ScenarioInput,
): SimulationResult {
  let level = startLevelCm ?? scenario.baseLevelCm;
  let peak = level;
  let maxRise = 0;
  let minutesToWatch: number | null = level >= thresholds.waterWatchThresholdCm ? 0 : null;
  let minutesToDanger: number | null = level >= thresholds.waterWarningThresholdCm ? 0 : null;
  let status: AlertStatus = "NORMAL";
  let current: AlertStatus = "NORMAL";
  let heavy = 0;
  let light = 0;

  const steps = Math.ceil((durationMin + AFTER_RAIN_MIN) / STEP_MIN);
  for (let i = 1; i <= steps; i++) {
    const minute = i * STEP_MIN;
    const rain = minute <= durationMin ? rainMmHr : 0;
    const prev = level;
    level += scenario.catchmentGain * rain - scenario.recession * (level - scenario.baseLevelCm);
    const rise = (level - prev) / STEP_MIN;
    peak = Math.max(peak, level);
    maxRise = Math.max(maxRise, rise);
    if (minutesToWatch === null && level >= thresholds.waterWatchThresholdCm) minutesToWatch = minute;
    if (minutesToDanger === null && level >= thresholds.waterWarningThresholdCm) minutesToDanger = minute;

    const isHeavy = rain >= thresholds.rainfallWatchThresholdMmHr;
    heavy = isHeavy ? heavy + 1 : 0;
    light = isHeavy ? 0 : light + 1;
    current = evaluateReading(
      { waterLevelCm: level, riseRateCmMin: rise, rainfallRateMmHr: rain },
      thresholds,
      { previousStatus: current, heavyRainReadings: heavy, lightRainReadings: light },
    ).status;
    if (RISK_META[current].rank > RISK_META[status].rank) status = current;
  }

  return { peakLevelCm: peak, maxRiseCmMin: maxRise, minutesToWatch, minutesToDanger, status };
}

/** Maps the exposure-adjusted peak (relative to the danger line) to a 0..1 likelihood. */
export function floodProbability(localPeakCm: number, dangerCm: number): number {
  const x = localPeakCm / dangerCm;
  return 1 / (1 + Math.exp(-5.5 * (x - 0.9)));
}

export function likelihoodFor(p: number): Likelihood {
  if (p < 0.15) return "LOW";
  if (p < 0.4) return "MODERATE";
  if (p < 0.7) return "HIGH";
  return "VERY_HIGH";
}

function probabilityAt(
  scenario: SiteScenario,
  thresholds: AlertThresholds,
  exposureFactor: number,
  input: ScenarioInput,
): { sim: SimulationResult; localPeakCm: number; probability: number } {
  const sim = simulateChannel(scenario, thresholds, input);
  const localPeakCm = scenario.baseLevelCm + (sim.peakLevelCm - scenario.baseLevelCm) * exposureFactor;
  return { sim, localPeakCm, probability: floodProbability(localPeakCm, thresholds.waterWarningThresholdCm) };
}

export function estimateFlood(location: LocationInput, input: ScenarioInput): FloodEstimate {
  const { site, distanceKm } = siteForLocation(location);
  const scenario = scenarioFor(site.siteId);
  const thresholds = getThresholds(site.siteId);
  const startLevelCm = input.startLevelCm ?? scenario.baseLevelCm;
  const { sim, localPeakCm, probability } = probabilityAt(scenario, thresholds, location.exposureFactor, {
    ...input,
    startLevelCm,
  });

  let tippingPointMmHr: number | null = null;
  for (let r = 1; r <= 150; r++) {
    const p = probabilityAt(scenario, thresholds, location.exposureFactor, {
      rainMmHr: r,
      durationMin: input.durationMin,
      startLevelCm,
    }).probability;
    if (p >= 0.5) {
      tippingPointMmHr = r;
      break;
    }
  }

  return {
    ...sim,
    site,
    distanceKm,
    confidence: confidenceFor(distanceKm),
    thresholds,
    startLevelCm,
    localPeakCm,
    probability,
    likelihood: likelihoodFor(probability),
    tippingPointMmHr,
  };
}

/** Likelihood across a range of intensities, for the "what if" chart. */
export function likelihoodCurve(
  location: LocationInput,
  durationMin: number,
  startLevelCm: number | undefined,
  intensities: number[] = [5, 10, 20, 30, 40, 50, 60, 80, 100],
): { rainMmHr: number; probability: number; likelihood: Likelihood }[] {
  const { site } = siteForLocation(location);
  const scenario = scenarioFor(site.siteId);
  const thresholds = getThresholds(site.siteId);
  return intensities.map((rainMmHr) => {
    const { probability } = probabilityAt(scenario, thresholds, location.exposureFactor, {
      rainMmHr,
      durationMin,
      startLevelCm: startLevelCm ?? scenario.baseLevelCm,
    });
    return { rainMmHr, probability, likelihood: likelihoodFor(probability) };
  });
}

export const LIKELIHOOD_META: Record<
  Likelihood,
  { label: string; summary: string; advice: string[]; tone: AlertStatus }
> = {
  LOW: {
    label: "Low",
    summary: "Flooding is unlikely in this rain.",
    advice: ["Keep gutters and drains in front of your home clear.", "Check AquaLert if the rain keeps going."],
    tone: "NORMAL",
  },
  MODERATE: {
    label: "Moderate",
    summary: "Some streets and low spots could flood.",
    advice: [
      "Avoid walking or driving through moving water.",
      "Raise valuables, documents and electrical items off the floor.",
      "Watch for AquaLert alerts on SMS or WhatsApp.",
    ],
    tone: "WATCH",
  },
  HIGH: {
    label: "High",
    summary: "Flooding is likely around drains and low ground.",
    advice: [
      "Move valuables and important documents to a higher place now.",
      "Plan how you would leave and where you would go.",
      "Keep children away from drains and gutters.",
    ],
    tone: "WARNING",
  },
  VERY_HIGH: {
    label: "Very high",
    summary: "Serious flooding is very likely. Be ready to move to higher ground.",
    advice: [
      "Move to higher ground early. Do not wait for water to enter your home.",
      "Switch off electricity at the mains if water is rising indoors.",
      "Never cross flooded roads or drains. Call 112 in an emergency.",
    ],
    tone: "WARNING",
  },
};

export const RAIN_PRESETS: { label: string; mmHr: number; description: string }[] = [
  { label: "Light", mmHr: 2, description: "Drizzle or light rain" },
  { label: "Moderate", mmHr: 8, description: "Steady rain" },
  { label: "Heavy", mmHr: 25, description: "A typical heavy downpour" },
  { label: "Very heavy", mmHr: 50, description: "A strong tropical storm" },
  { label: "Extreme", mmHr: 90, description: "The kind of storm behind Accra's worst floods" },
];

export function describeRain(mmHr: number): string {
  if (mmHr < 2.5) return "light";
  if (mmHr < 10) return "moderate";
  if (mmHr < 30) return "heavy";
  if (mmHr < 60) return "very heavy";
  return "extreme";
}
