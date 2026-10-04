/**
 * Live rainfall for Accra from Open-Meteo (https://open-meteo.com).
 *
 * Free and keyless for non-commercial use (about 10,000 calls a day), and it
 * allows calls straight from the browser. Values come from global weather
 * models (ECMWF, GFS and others, blended by Open-Meteo's "best match"), so
 * they are real forecasts and model estimates of recent rain, not readings
 * from a rain gauge. Accra has no native 15-minute model, so we use hourly
 * values.
 *
 * Commercial use needs an Open-Meteo API plan: set
 * NEXT_PUBLIC_OPEN_METEO_URL to the customer endpoint and add the key there.
 */

export const OPEN_METEO_URL =
  process.env.NEXT_PUBLIC_OPEN_METEO_URL ?? "https://api.open-meteo.com/v1/forecast";

const PAST_HOURS = 24;
const FORECAST_HOURS = 48;
/** Hourly rain at or above this counts as part of a storm (mm/hr). */
const STORM_MIN_MM_HR = 1;
/** Below this peak there is no meaningful rain to plan for (mm/hr). */
const NO_RAIN_MM_HR = 0.5;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface RainHour {
  /** End of the hour the rain fell in (epoch ms). */
  time: number;
  /** Rain over that hour, which is also its average intensity in mm/hr. */
  mm: number;
  /** Chance of rain in that hour, 0–100, when the model provides it. */
  probability: number | null;
}

export interface RainStorm {
  start: number;
  end: number;
  peakTime: number;
  peakMmHr: number;
  totalMm: number;
  durationMin: number;
  probability: number | null;
}

export interface RainOutlook {
  latitude: number;
  longitude: number;
  /** When Open-Meteo's "current" values are valid (epoch ms). */
  updatedAt: number;
  /** Rain intensity right now (mm/hr), from the latest 15-minute model value. */
  nowMmHr: number;
  past: RainHour[];
  next: RainHour[];
  past24hMm: number;
  next6hMm: number;
  next24hMm: number;
  /** Heaviest forecast rain in the next 48 hours, or null if none is expected. */
  storm: RainStorm | null;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current?: { time: number; interval: number; precipitation: number | null };
  hourly?: { time: number[]; precipitation: (number | null)[]; precipitation_probability?: (number | null)[] };
}

export function buildRainUrl(points: GeoPoint[]): string {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.latitude.toFixed(4)).join(","),
    longitude: points.map((p) => p.longitude.toFixed(4)).join(","),
    current: "precipitation",
    hourly: "precipitation,precipitation_probability",
    past_hours: String(PAST_HOURS),
    forecast_hours: String(FORECAST_HOURS),
    timezone: "GMT",
    timeformat: "unixtime",
  });
  return `${OPEN_METEO_URL}?${params}`;
}

const sum = (hours: RainHour[]) => hours.reduce((s, h) => s + h.mm, 0);

/** The heaviest forecast hour, widened to the surrounding hours with at least light rain. */
export function findStorm(next: RainHour[]): RainStorm | null {
  if (next.length === 0) return null;
  let peak = 0;
  next.forEach((h, i) => {
    if (h.mm > next[peak]!.mm) peak = i;
  });
  const top = next[peak]!;
  if (top.mm < NO_RAIN_MM_HR) return null;
  const threshold = Math.min(STORM_MIN_MM_HR, top.mm);
  let a = peak;
  let b = peak;
  while (a > 0 && next[a - 1]!.mm >= threshold) a--;
  while (b < next.length - 1 && next[b + 1]!.mm >= threshold) b++;
  const hours = next.slice(a, b + 1);
  const probs = hours.map((h) => h.probability).filter((p): p is number => p !== null);
  return {
    start: next[a]!.time - 3_600_000,
    end: next[b]!.time,
    peakTime: top.time,
    peakMmHr: top.mm,
    totalMm: sum(hours),
    durationMin: hours.length * 60,
    probability: probs.length ? Math.max(...probs) : null,
  };
}

export function parseRainOutlook(raw: OpenMeteoResponse, nowMs: number): RainOutlook {
  const h = raw.hourly ?? { time: [], precipitation: [] };
  const hours: RainHour[] = h.time.map((t, i) => ({
    time: t * 1000,
    mm: Math.max(0, h.precipitation[i] ?? 0),
    probability: h.precipitation_probability?.[i] ?? null,
  }));
  // An hourly value covers the hour that ends at its timestamp.
  const past = hours.filter((x) => x.time <= nowMs);
  const next = hours.filter((x) => x.time > nowMs);
  const c = raw.current;
  const nowMmHr = c && c.precipitation !== null && c.interval > 0 ? (c.precipitation * 3600) / c.interval : (past.at(-1)?.mm ?? 0);
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    updatedAt: c ? c.time * 1000 : nowMs,
    nowMmHr,
    past: past.slice(-PAST_HOURS),
    next,
    past24hMm: sum(past.slice(-24)),
    next6hMm: sum(next.slice(0, 6)),
    next24hMm: sum(next.slice(0, 24)),
    storm: findStorm(next),
  };
}

/** Fetch rain outlooks for one or more points in a single request. */
export async function fetchRainOutlooks(points: GeoPoint[], signal?: AbortSignal): Promise<RainOutlook[]> {
  if (points.length === 0) return [];
  const res = await fetch(buildRainUrl(points), { signal });
  if (!res.ok) throw new Error(`Weather service error (${res.status})`);
  const body = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[];
  const list = Array.isArray(body) ? body : [body];
  const now = Date.now();
  return list.map((r) => parseRainOutlook(r, now));
}
