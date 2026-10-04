import { beforeAll, describe, expect, it } from "vitest";
import { createMockApi } from "@/lib/api/mock-api";
import { resetMockClock } from "@/lib/api/mock/database";

const NOW = Date.parse("2026-10-04T10:45:00Z");
const api = createMockApi({ latencyMs: 0, now: () => NOW });

beforeAll(() => resetMockClock(NOW));

describe("mock API", () => {
  it("returns six Accra sites with at least one stale and one offline node", async () => {
    const sites = await api.getSites();
    expect(sites.map((s) => s.siteName)).toEqual(["Alajo", "Kaneshie", "Avenor", "Adabraka", "Circle", "Weija"]);
    expect(sites.find((s) => s.siteId === "circle")?.status).toBe("STALE");
    expect(sites.find((s) => s.siteId === "weija")?.status).toBe("OFFLINE");
  });

  it("has sites in Normal, Watch and Warning", async () => {
    const alerts = await api.getAlertHistory();
    const current = new Map<string, string>();
    for (const a of alerts) if (!current.has(a.siteId)) current.set(a.siteId, a.alertStatus);
    const statuses = new Set(current.values());
    expect(statuses).toContain("WARNING");
    expect(statuses).toContain("WATCH");
    expect(["avenor", "adabraka"].every((id) => (current.get(id) ?? "NORMAL") === "NORMAL")).toBe(true);
  });

  it("shows Alajo moving Normal -> Watch -> Warning in the current storm", async () => {
    const alerts = (await api.getAlertHistory("alajo", "24h")).reverse();
    expect(alerts.map((a) => a.alertStatus)).toEqual(["WATCH", "WARNING"]);
  });

  it("returns chronological readings within the requested range", async () => {
    const series = await api.getReadingsTimeSeries("alajo", "6h");
    expect(series.length).toBe(73);
    const times = series.map((r) => Date.parse(r.timestampUtc));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times[0]).toBeGreaterThanOrEqual(NOW - 6 * 3_600_000);
  });

  it("thins 7-day series to a chart-friendly size", async () => {
    const series = await api.getReadingsTimeSeries("kaneshie", "7d");
    expect(series.length).toBeLessThanOrEqual(400);
    expect(series.at(-1)?.timestampUtc).toBe(new Date(NOW).toISOString());
  });

  it("records SMS and WhatsApp notifications for every Warning", async () => {
    const warnings = (await api.getAlertHistory()).filter((a) => a.alertStatus === "WARNING");
    expect(warnings.length).toBeGreaterThan(0);
    for (const w of warnings) {
      const logs = await api.getNotificationsByAlert(w.alertId);
      expect(logs.some((n) => n.channel === "SMS" && n.recipientGroup === "RESIDENTS")).toBe(true);
      expect(logs.some((n) => n.channel === "WHATSAPP")).toBe(true);
    }
  });

  it("returns null for unknown ids", async () => {
    expect(await api.getSite("nowhere")).toBeNull();
    expect(await api.getAlertById("ALT-NOPE")).toBeNull();
  });
});
