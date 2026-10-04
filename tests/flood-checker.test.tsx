import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FloodChecker } from "@/components/landing/flood-checker";

const rain = vi.hoisted(() => ({ outlook: { data: undefined as unknown, isPending: false, isError: true } }));

vi.mock("@/lib/hooks/queries", () => ({
  useSiteOverviews: () => ({ data: undefined, isPending: true }),
  useRainOutlook: () => rain.outlook,
}));

const PEAK = Date.parse("2026-10-05T15:00:00Z");
function outlook(peakMmHr: number | null) {
  return {
    data: {
      storm:
        peakMmHr === null
          ? null
          : { start: PEAK - 2 * 3_600_000, end: PEAK, peakTime: PEAK, peakMmHr, totalMm: peakMmHr * 1.5, durationMin: 120, probability: 80 },
    },
    isPending: false,
    isError: false,
  };
}

describe("FloodChecker", () => {
  it("shows an empty state until an area is chosen", () => {
    render(<FloodChecker />);
    expect(screen.getByText("Choose an area to see its flood risk")).toBeInTheDocument();
  });

  it("estimates risk for a searched area and updates with rain intensity", () => {
    render(<FloodChecker />);
    const input = screen.getByRole("combobox", { name: "Your area" });
    fireEvent.change(input, { target: { value: "alaj" } });
    fireEvent.click(screen.getByRole("option", { name: /Alajo/ }));

    expect(screen.getByTestId("checker-place")).toHaveTextContent("Alajo");

    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent("Low");

    fireEvent.click(screen.getByRole("button", { name: "Extreme" }));
    fireEvent.click(screen.getByRole("button", { name: "3 hours" }));
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent(/High|Very high/);
    expect(screen.getByText(/not an official flood forecast/)).toBeInTheDocument();
  });

  it("offers a map search when the area is not in the local list", () => {
    render(<FloodChecker />);
    fireEvent.change(screen.getByRole("combobox", { name: "Your area" }), { target: { value: "Spintex Road" } });
    expect(screen.getByRole("option", { name: /Search the map for/ })).toBeInTheDocument();
  });

  it("uses the real rain forecast by default", () => {
    rain.outlook = outlook(60);
    render(<FloodChecker />);
    fireEvent.click(screen.getByRole("button", { name: "Alajo" }));
    expect(screen.getByText(/Forecast: 60 mm\/hr of extreme rain for about 2 h on Mon 15:00 in/)).toBeInTheDocument();
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent(/High|Very high/);

    // Touching a control switches to a what-if scenario.
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByText(/What if: 2.0 mm\/hr of light rain for 2 h in/)).toBeInTheDocument();
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent("Low");
  });

  it("says when no rain is forecast", () => {
    rain.outlook = outlook(null);
    render(<FloodChecker />);
    fireEvent.click(screen.getByRole("button", { name: "Osu" }));
    expect(screen.getAllByText(/no significant rain/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent("Low");
    rain.outlook = { data: undefined, isPending: false, isError: true };
  });

  it("supports quick picks", () => {
    render(<FloodChecker />);
    fireEvent.click(screen.getByRole("button", { name: "Kaneshie" }));
    expect(screen.getByTestId("checker-place")).toHaveTextContent("Kaneshie");
  });
});
