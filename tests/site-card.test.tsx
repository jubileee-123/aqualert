import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SiteCard } from "@/components/overview/site-card";
import { overview, reading } from "./fixtures";

const NOW = Date.parse("2026-10-04T10:04:00Z");

describe("SiteCard", () => {
  it("shows the site, status text and key metrics", () => {
    render(<SiteCard overview={overview()} nowMs={NOW} alertsInRange={2} rangeLabel="Last 24h" />);
    const card = screen.getByRole("article", { name: "Alajo" });
    expect(within(card).getByText("Warning")).toBeInTheDocument();
    expect(within(card).getByText("160")).toBeInTheDocument();
    expect(within(card).getByText("12.0")).toBeInTheDocument();
    expect(within(card).getByText("+1.20")).toBeInTheDocument();
    expect(within(card).getByText(/4 min ago/)).toBeInTheDocument();
    expect(within(card).getByText("Online")).toBeInTheDocument();
    expect(within(card).getByText(/2 alerts last 24h/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "View details for Alajo" })).toHaveAttribute("href", "/sites/alajo");
  });

  it("flags stale nodes and labels the status as last known", () => {
    const o = overview({ riskStatus: "WATCH", site: { ...overview().site, status: "STALE" } });
    render(<SiteCard overview={o} nowMs={NOW} />);
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("last known")).toBeInTheDocument();
    expect(screen.getByText(/Node not reporting/)).toBeInTheDocument();
  });

  it("handles a node that has never reported", () => {
    render(<SiteCard overview={overview({ latestReading: null, riskStatus: "NORMAL" })} nowMs={NOW} />);
    expect(screen.getByText(/No readings received/)).toBeInTheDocument();
    expect(screen.getByText("Never reported")).toBeInTheDocument();
  });

  it("draws a labelled sparkline when trend data is provided", () => {
    render(<SiteCard overview={overview({ latestReading: reading() })} nowMs={NOW} trend={[40, 60, 120, 160]} rangeLabel="Last 24h" />);
    expect(screen.getByRole("img", { name: "Water level trend for Alajo, Last 24h" })).toBeInTheDocument();
  });
});
