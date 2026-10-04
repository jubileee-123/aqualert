import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRainUrl, fetchRainOutlooks, findStorm, parseRainOutlook, type RainHour } from "@/lib/weather/open-meteo";

const NOW = Date.parse("2026-10-04T12:20:00Z");
const H = 3_600_000;
const hourStart = Date.parse("2026-10-03T13:00:00Z");

/** 24 past hours + 48 forecast hours in Open-Meteo's unixtime shape. */
function response(rain: (i: number) => number, prob: (i: number) => number | null = () => 40) {
  const time = Array.from({ length: 72 }, (_, i) => (hourStart + i * H) / 1000);
  return {
    latitude: 5.6,
    longitude: -0.225,
    current: { time: Date.parse("2026-10-04T12:15:00Z") / 1000, interval: 900, precipitation: 0.5 },
    hourly: { time, precipitation: time.map((_, i) => rain(i)), precipitation_probability: time.map((_, i) => prob(i)) },
  };
}

const hour = (i: number, mm: number, probability: number | null = null): RainHour => ({ time: hourStart + i * H, mm, probability });

describe("buildRainUrl", () => {
  it("asks for every point in one request with hourly rain in unix time", () => {
    const url = new URL(buildRainUrl([{ latitude: 5.6012, longitude: -0.2265 }, { latitude: 5.5705, longitude: -0.2365 }]));
    expect(url.searchParams.get("latitude")).toBe("5.6012,5.5705");
    expect(url.searchParams.get("longitude")).toBe("-0.2265,-0.2365");
    expect(url.searchParams.get("hourly")).toBe("precipitation,precipitation_probability");
    expect(url.searchParams.get("timeformat")).toBe("unixtime");
  });
});

describe("findStorm", () => {
  it("returns null when no meaningful rain is forecast", () => {
    expect(findStorm([hour(0, 0), hour(1, 0.2)])).toBeNull();
  });

  it("finds the heaviest hour and the rainy hours around it", () => {
    const storm = findStorm([hour(0, 0), hour(1, 2, 30), hour(2, 18, 70), hour(3, 6, 60), hour(4, 0.3), hour(5, 4)]);
    expect(storm).toMatchObject({ peakMmHr: 18, durationMin: 180, totalMm: 26, probability: 70, peakTime: hourStart + 2 * H });
    expect(storm!.start).toBe(hourStart);
    expect(storm!.end).toBe(hourStart + 3 * H);
  });
});

describe("parseRainOutlook", () => {
  it("splits past and forecast hours and totals them", () => {
    // 1 mm in each past hour, then a 3-hour storm 10 hours ahead.
    const o = parseRainOutlook(response((i) => (i < 24 ? 1 : i >= 33 && i <= 35 ? [5, 30, 8][i - 33]! : 0)), NOW);
    expect(o.past).toHaveLength(24);
    expect(o.next).toHaveLength(48);
    expect(o.past24hMm).toBeCloseTo(24);
    expect(o.next6hMm).toBe(0);
    expect(o.next24hMm).toBeCloseTo(43);
    expect(o.nowMmHr).toBeCloseTo(2); // 0.5 mm in 15 minutes
    expect(o.storm).toMatchObject({ peakMmHr: 30, durationMin: 180 });
  });

  it("copes with missing values", () => {
    const o = parseRainOutlook(response(() => null as unknown as number, () => null), NOW);
    expect(o.next24hMm).toBe(0);
    expect(o.storm).toBeNull();
  });
});

describe("fetchRainOutlooks", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("handles single and multi-location responses", async () => {
    const one = response(() => 0);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [one, one] }));
    expect(await fetchRainOutlooks([{ latitude: 1, longitude: 1 }, { latitude: 2, longitude: 2 }])).toHaveLength(2);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => one }));
    expect(await fetchRainOutlooks([{ latitude: 1, longitude: 1 }])).toHaveLength(1);
  });

  it("throws on service errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(fetchRainOutlooks([{ latitude: 1, longitude: 1 }])).rejects.toThrow("429");
  });
});
