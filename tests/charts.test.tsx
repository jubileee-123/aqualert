import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { cloneElement } from "react";

// jsdom has no layout, so give charts a fixed size instead of ResponsiveContainer's measured one.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children, { width: 600, height: 300 } as Record<string, unknown>),
  };
});
import { render, screen } from "@testing-library/react";
import { WaterLevelChart } from "@/components/site/water-level-chart";
import { RainfallChart } from "@/components/site/rainfall-chart";
import { DEFAULT_THRESHOLDS } from "@/lib/constants/thresholds";
import { reading } from "./fixtures";

const series = [
  reading({ timestampUtc: "2026-10-04T09:50:00Z", waterLevelCm: 70, rainfallRateMmHr: 10 }),
  reading({ timestampUtc: "2026-10-04T09:55:00Z", waterLevelCm: 400, dataValidity: "SUSPECT", rainfallRateMmHr: 48 }),
  reading({ timestampUtc: "2026-10-04T10:00:00Z", waterLevelCm: 160, rainfallRateMmHr: 30 }),
];

describe("site detail charts", () => {
  it("water level chart explains both threshold lines and summarises the data", () => {
    const { container } = render(<WaterLevelChart readings={series} thresholds={DEFAULT_THRESHOLDS} range="1h" />);
    // Threshold reference lines are drawn with their labels.
    expect(container.querySelector(".recharts-line")).not.toBeNull();
    expect(screen.getByText("Watch 80 cm")).toBeInTheDocument();
    expect(screen.getByText("Danger 150 cm")).toBeInTheDocument();
    expect(screen.getByText(/Watch line: at or above this level/)).toBeInTheDocument();
    expect(screen.getByText(/Danger line: above this and rising faster than 0.8 cm\/min/)).toBeInTheDocument();
    // Suspect readings are excluded from the summary.
    expect(screen.getByTestId("water-chart-summary")).toHaveTextContent(
      "Water level ranged from 70 to 160 cm; latest 160 cm. Watch line 80 cm, danger line 150 cm.",
    );
  });

  it("rainfall chart reports the peak intensity and watch threshold", () => {
    render(<RainfallChart readings={series} thresholds={DEFAULT_THRESHOLDS} range="1h" />);
    expect(screen.getByText(/Watch intensity: sustained for 15 min/)).toBeInTheDocument();
    expect(screen.getByTestId("rain-chart-summary")).toHaveTextContent(
      "Peak rainfall intensity 48.0 mm/hr. Watch threshold 20 mm/hr.",
    );
  });

  it("handles an empty series", () => {
    render(<WaterLevelChart readings={[]} thresholds={DEFAULT_THRESHOLDS} range="24h" />);
    expect(screen.getByTestId("water-chart-summary")).toHaveTextContent("No water level readings in this period.");
  });
});
