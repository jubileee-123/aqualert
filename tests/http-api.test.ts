import { describe, expect, it, vi } from "vitest";
import { createHttpApi } from "@/lib/api/http-api";

describe("HTTP API client", () => {
  it("maps contract calls to REST routes", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    const api = createHttpApi("https://backend.example/api/", fetchMock as unknown as typeof fetch);
    await api.getReadingsTimeSeries("alajo", "6h");
    await api.getAlertHistory("kaneshie", { fromUtc: "2026-10-01T00:00:00Z", toUtc: "2026-10-02T00:00:00Z" });
    const urls = fetchMock.mock.calls.map((c) => (c as unknown as [string])[0]);
    expect(urls[0]).toBe("https://backend.example/api/sites/alajo/readings?range=6h");
    expect(urls[1]).toContain("/alerts?siteId=kaneshie&from=2026-10-01T00%3A00%3A00Z");
  });

  it("returns null on 404 and throws on server errors", async () => {
    const api404 = createHttpApi("/api", (async () => new Response("", { status: 404 })) as unknown as typeof fetch);
    expect(await api404.getSite("x")).toBeNull();
    const api500 = createHttpApi("/api", (async () => new Response("", { status: 500 })) as unknown as typeof fetch);
    await expect(api500.getSites()).rejects.toThrow(/500/);
  });
});
