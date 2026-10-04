/**
 * Rainy-season scenarios that drive the mock data. Storm times are minutes
 * relative to the scenario anchor (the moment the mock service started), so
 * the "current" storm is always happening when the dashboard is opened.
 */

export interface StormEvent {
  /** Start time in minutes relative to the anchor (negative = in the past). */
  startOffsetMin: number;
  durationMin: number;
  peakMmHr: number;
  /** Fraction of the duration at which intensity peaks (convective storms peak early). */
  peakAt?: number;
}

export interface SiteScenario {
  siteId: string;
  /** Dry-weather flow depth in the channel. */
  baseLevelCm: number;
  /** cm of level gained per 5-min step for each mm/hr of rain (catchment response). */
  catchmentGain: number;
  /** Fraction of the excess level above base that drains away each step. */
  recession: number;
  noiseCm: number;
  storms: StormEvent[];
  /** Node stops transmitting this many minutes before "now" (simulates a stale/offline node). */
  silentForMin?: number;
  batteryBaseV: number;
  /** Volts lost per day (a failing panel or battery). */
  batteryDrainPerDay?: number;
  signalBaseDbm: number;
}

const DAY = 24 * 60;

export const SCENARIOS: SiteScenario[] = [
  {
    // Normal -> Watch -> Warning during the current storm.
    siteId: "alajo",
    baseLevelCm: 38,
    catchmentGain: 0.14,
    recession: 0.035,
    noiseCm: 0.8,
    storms: [
      { startOffsetMin: -5 * DAY - 300, durationMin: 150, peakMmHr: 34 },
      { startOffsetMin: -2 * DAY + 120, durationMin: 200, peakMmHr: 48 },
      { startOffsetMin: -170, durationMin: 330, peakMmHr: 92, peakAt: 0.35 },
    ],
    batteryBaseV: 3.95,
    signalBaseDbm: -82,
  },
  {
    // On Watch now: sustained moderate rain; earlier Warning two days ago.
    siteId: "kaneshie",
    baseLevelCm: 30,
    catchmentGain: 0.17,
    recession: 0.045,
    noiseCm: 0.7,
    storms: [
      { startOffsetMin: -2 * DAY + 100, durationMin: 240, peakMmHr: 88, peakAt: 0.25 },
      { startOffsetMin: -95, durationMin: 260, peakMmHr: 32, peakAt: 0.4 },
    ],
    batteryBaseV: 3.88,
    signalBaseDbm: -88,
  },
  {
    // Normal: light showers now, a Watch event in the past.
    siteId: "avenor",
    baseLevelCm: 26,
    catchmentGain: 0.09,
    recession: 0.05,
    noiseCm: 0.6,
    storms: [
      { startOffsetMin: -2 * DAY + 110, durationMin: 210, peakMmHr: 60 },
      { startOffsetMin: -60, durationMin: 150, peakMmHr: 9 },
    ],
    batteryBaseV: 4.02,
    signalBaseDbm: -76,
  },
  {
    // Normal now, one Watch event three days ago.
    siteId: "adabraka",
    baseLevelCm: 22,
    catchmentGain: 0.1,
    recession: 0.05,
    noiseCm: 0.6,
    storms: [
      { startOffsetMin: -3 * DAY - 200, durationMin: 160, peakMmHr: 55 },
      { startOffsetMin: -30, durationMin: 90, peakMmHr: 6 },
    ],
    batteryBaseV: 3.9,
    signalBaseDbm: -91,
  },
  {
    // Stale: node went quiet during the current storm, last known Watch.
    siteId: "circle",
    baseLevelCm: 20,
    catchmentGain: 0.15,
    recession: 0.05,
    noiseCm: 0.9,
    storms: [
      { startOffsetMin: -2 * DAY + 90, durationMin: 220, peakMmHr: 84, peakAt: 0.25 },
      { startOffsetMin: -150, durationMin: 300, peakMmHr: 44, peakAt: 0.3 },
    ],
    silentForMin: 35,
    batteryBaseV: 3.72,
    signalBaseDbm: -104,
  },
  {
    // Offline: battery ran down and the node stopped reporting hours ago.
    siteId: "weija",
    baseLevelCm: 55,
    catchmentGain: 0.12,
    recession: 0.03,
    noiseCm: 0.8,
    storms: [{ startOffsetMin: -4 * DAY - 400, durationMin: 240, peakMmHr: 62 }],
    silentForMin: 7 * 60,
    batteryBaseV: 3.85,
    batteryDrainPerDay: 0.09,
    signalBaseDbm: -95,
  },
];
