import { describe, expect, it } from "vitest";
import { deriveNodeStatus, deriveStatusTransitions, evaluateReading } from "@/lib/alert-logic";
import { DEFAULT_THRESHOLDS as T } from "@/lib/constants/thresholds";
import { reading } from "./fixtures";

const calm = { previousStatus: "NORMAL" as const, heavyRainReadings: 0, lightRainReadings: 10 };

describe("evaluateReading", () => {
  it("is Normal when everything is below thresholds", () => {
    const r = reading({ waterLevelCm: 40, riseRateCmMin: 0.1, rainfallRateMmHr: 5 });
    expect(evaluateReading(r, T, calm).status).toBe("NORMAL");
  });

  it("raises Watch when the level reaches the watch line", () => {
    const r = reading({ waterLevelCm: T.waterWatchThresholdCm, riseRateCmMin: 0, rainfallRateMmHr: 0 });
    expect(evaluateReading(r, T, calm).status).toBe("WATCH");
  });

  it("only raises Watch for rain once it is sustained for the confirmation period", () => {
    const r = reading({ waterLevelCm: 30, riseRateCmMin: 0, rainfallRateMmHr: 35 });
    expect(evaluateReading(r, T, { ...calm, heavyRainReadings: 2, lightRainReadings: 0 }).status).toBe("NORMAL");
    expect(evaluateReading(r, T, { ...calm, heavyRainReadings: 3, lightRainReadings: 0 }).status).toBe("WATCH");
  });

  it("needs both danger level and rapid rise for Warning", () => {
    const high = reading({ waterLevelCm: 160, riseRateCmMin: 0.2, rainfallRateMmHr: 0 });
    expect(evaluateReading(high, T, calm).status).toBe("WATCH");
    const rising = reading({ waterLevelCm: 160, riseRateCmMin: 1.0, rainfallRateMmHr: 0 });
    expect(evaluateReading(rising, T, calm).status).toBe("WARNING");
  });

  it("holds Warning while the level stays at the danger line", () => {
    const r = reading({ waterLevelCm: 148, riseRateCmMin: -0.2, rainfallRateMmHr: 0 });
    expect(evaluateReading(r, T, { ...calm, previousStatus: "WARNING" }).status).toBe("WARNING");
  });
});

describe("deriveStatusTransitions", () => {
  it("walks Normal -> Watch -> Warning and ignores suspect readings", () => {
    const series = [
      reading({ waterLevelCm: 40, riseRateCmMin: 0, rainfallRateMmHr: 0 }),
      reading({ waterLevelCm: 400, riseRateCmMin: 9, dataValidity: "SUSPECT" }),
      reading({ waterLevelCm: 90, riseRateCmMin: 0.5, rainfallRateMmHr: 0 }),
      reading({ waterLevelCm: 155, riseRateCmMin: 1.5, rainfallRateMmHr: 0 }),
    ];
    const { transitions, finalStatus } = deriveStatusTransitions(series, T);
    expect(transitions.map((t) => t.to)).toEqual(["WATCH", "WARNING"]);
    expect(finalStatus).toBe("WARNING");
  });
});

describe("deriveNodeStatus", () => {
  const now = Date.parse("2026-10-04T12:00:00Z");
  it.each([
    ["2026-10-04T11:55:00Z", "ONLINE"],
    ["2026-10-04T11:40:00Z", "STALE"],
    ["2026-10-04T10:30:00Z", "OFFLINE"],
    [null, "OFFLINE"],
  ] as const)("last reading %s -> %s", (ts, expected) => {
    expect(deriveNodeStatus(ts, now)).toBe(expected);
  });
});
