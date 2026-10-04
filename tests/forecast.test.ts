import { describe, expect, it } from "vitest";
import { EXPOSURE_FACTOR, PLACES, searchPlaces } from "@/lib/constants/places";
import {
  confidenceFor,
  estimateFlood,
  floodProbability,
  likelihoodCurve,
  likelihoodFor,
  nearestSite,
  simulateChannel,
  siteForLocation,
  type LocationInput,
} from "@/lib/forecast";
import { getThresholds } from "@/lib/constants/thresholds";

const loc = (id: string): LocationInput => {
  const p = PLACES.find((x) => x.id === id)!;
  return { name: p.name, latitude: p.latitude, longitude: p.longitude, exposureFactor: EXPOSURE_FACTOR[p.exposure], channelSiteId: p.channelSiteId };
};

describe("searchPlaces", () => {
  it("ranks exact and prefix matches first and matches aliases", () => {
    expect(searchPlaces("kaneshie")[0]?.id).toBe("kaneshie");
    expect(searchPlaces("circle")[0]?.id).toBe("circle");
    expect(searchPlaces("legon").map((p) => p.id)).toEqual(expect.arrayContaining(["legon", "east-legon"]));
    expect(searchPlaces("Abossey-Okai")[0]?.id).toBe("abossey-okai");
  });

  it("returns nothing for blank or unknown queries", () => {
    expect(searchPlaces("   ")).toEqual([]);
    expect(searchPlaces("zzzz")).toEqual([]);
  });
});

describe("site lookup", () => {
  it("uses the nearest sensor, or the draining channel when one is set", () => {
    expect(nearestSite(5.6012, -0.2265).site.siteId).toBe("alajo");
    expect(siteForLocation(loc("agbogbloshie")).site.siteId).toBe("alajo");
  });

  it("lowers confidence with distance", () => {
    expect(confidenceFor(1)).toBe("HIGH");
    expect(confidenceFor(4)).toBe("MEDIUM");
    expect(confidenceFor(10)).toBe("LOW");
  });
});

describe("simulateChannel", () => {
  const t = getThresholds("alajo");
  const model = { baseLevelCm: 30, catchmentGain: 0.6, recession: 0.08 };

  it("stays Normal with no rain", () => {
    const r = simulateChannel(model, t, { rainMmHr: 0, durationMin: 60 });
    expect(r.status).toBe("NORMAL");
    expect(r.peakLevelCm).toBeCloseTo(30);
    expect(r.minutesToDanger).toBeNull();
  });

  it("rises more with heavier rain", () => {
    const light = simulateChannel(model, t, { rainMmHr: 5, durationMin: 60 });
    const heavy = simulateChannel(model, t, { rainMmHr: 60, durationMin: 60 });
    expect(heavy.peakLevelCm).toBeGreaterThan(light.peakLevelCm);
    expect(RANK[heavy.status]).toBeGreaterThanOrEqual(RANK[light.status]);
  });
});

const RANK = { NORMAL: 0, WATCH: 1, WARNING: 2 } as const;

describe("likelihood", () => {
  it("maps probability bands to categories", () => {
    expect(likelihoodFor(0.05)).toBe("LOW");
    expect(likelihoodFor(0.3)).toBe("MODERATE");
    expect(likelihoodFor(0.6)).toBe("HIGH");
    expect(likelihoodFor(0.9)).toBe("VERY_HIGH");
    expect(floodProbability(200, 100)).toBeGreaterThan(floodProbability(50, 100));
  });

  it("gives a flood-prone area a higher chance than high ground in the same storm", () => {
    const scenario = { rainMmHr: 40, durationMin: 60 };
    const alajo = estimateFlood(loc("alajo"), scenario);
    const legon = estimateFlood(loc("legon"), scenario);
    expect(alajo.probability).toBeGreaterThan(legon.probability);
  });

  it("is low in light rain and high in an extreme storm for Alajo", () => {
    expect(estimateFlood(loc("alajo"), { rainMmHr: 2, durationMin: 60 }).likelihood).toBe("LOW");
    expect(["HIGH", "VERY_HIGH"]).toContain(estimateFlood(loc("alajo"), { rainMmHr: 90, durationMin: 120 }).likelihood);
  });

  it("reports a tipping point consistent with the estimate", () => {
    const e = estimateFlood(loc("kaneshie"), { rainMmHr: 25, durationMin: 60 });
    expect(e.tippingPointMmHr).not.toBeNull();
    const at = estimateFlood(loc("kaneshie"), { rainMmHr: e.tippingPointMmHr!, durationMin: 60 });
    expect(at.probability).toBeGreaterThanOrEqual(0.5);
  });

  it("produces a curve that never falls as rain increases", () => {
    const curve = likelihoodCurve(loc("kaneshie"), 60, undefined);
    for (let i = 1; i < curve.length; i++) expect(curve[i]!.probability).toBeGreaterThanOrEqual(curve[i - 1]!.probability);
  });

  it("starts higher when the channel is already full", () => {
    const dry = estimateFlood(loc("alajo"), { rainMmHr: 20, durationMin: 60 });
    const wet = estimateFlood(loc("alajo"), { rainMmHr: 20, durationMin: 60, startLevelCm: dry.thresholds.waterWatchThresholdCm });
    expect(wet.probability).toBeGreaterThan(dry.probability);
  });
});
