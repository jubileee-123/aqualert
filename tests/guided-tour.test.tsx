import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuidedTour } from "@/components/tour/guided-tour";
import { useTour } from "@/lib/store/tour";
import { TOUR_STEPS } from "@/lib/tour/steps";

const push = vi.fn();
// Next's router object is stable between renders; mirror that.
const router = { push };
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => router,
}));

beforeEach(() => {
  window.localStorage.clear();
  useTour.setState({ active: false, index: 0 });
  push.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("GuidedTour", () => {
  it("starts automatically on a first visit to the overview", () => {
    vi.useFakeTimers();
    render(<GuidedTour />);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("dialog", { name: "Welcome to AquaLert" })).toBeInTheDocument();
  });

  it("does not auto-start once the tour has been completed", () => {
    window.localStorage.setItem("aqualert-tour-completed-v1", "1");
    vi.useFakeTimers();
    render(<GuidedTour />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("steps forward and back, and explains the three statuses", { timeout: 15000 }, async () => {
    render(<GuidedTour />);
    act(() => useTour.getState().start());
    await userEvent.click(await screen.findByRole("button", { name: /Start tour/ }));
    // Targeted steps fall back to a centred card when their element is missing (as in jsdom).
    const dialog = await screen.findByRole("dialog", { name: "Three levels of flood risk" }, { timeout: 7000 });
    expect(dialog).toHaveTextContent("Warning (red)");
    expect(dialog).toHaveTextContent(`Step 1 of ${TOUR_STEPS.length - 1}`);
    await userEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(await screen.findByRole("dialog", { name: "Welcome to AquaLert" })).toBeInTheDocument();
  });

  it("navigates to the page a step lives on", () => {
    render(<GuidedTour />);
    const siteStep = TOUR_STEPS.findIndex((s) => s.path.startsWith("/sites/"));
    act(() => useTour.setState({ active: true, index: siteStep }));
    expect(push).toHaveBeenCalledWith(TOUR_STEPS[siteStep]!.path);
  });

  it("closes on Escape and remembers that it was seen", async () => {
    render(<GuidedTour />);
    act(() => useTour.getState().start());
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.localStorage.getItem("aqualert-tour-completed-v1")).toBe("1");
  });

  it("offers Skip on every step except the last, and skipping ends the tour", async () => {
    // jsdom has no layout; give anchors a size so targeted steps resolve immediately.
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValue({ top: 100, left: 20, width: 300, height: 120, bottom: 220, right: 320, x: 20, y: 100, toJSON: () => ({}) });
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <>
        <div data-tour="summary" />
        <div data-tour="site-card" />
        <GuidedTour />
      </>,
    );
    // The mocked router stays on "/", so check every overview step.
    const overviewSteps = TOUR_STEPS.map((s, i) => ({ s, i })).filter(({ s, i }) => s.path === "/" && i < TOUR_STEPS.length - 1);
    for (const { i } of overviewSteps) {
      act(() => useTour.setState({ active: true, index: i }));
      expect(await screen.findByRole("button", { name: "Skip tour" })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.localStorage.getItem("aqualert-tour-completed-v1")).toBe("1");
    rectSpy.mockRestore();
  });

  it("is short: only the essential steps", () => {
    expect(TOUR_STEPS.length).toBeLessThanOrEqual(6);
  });

  it("every targeted step points at a data-tour anchor", () => {
    for (const s of TOUR_STEPS) if (s.target) expect(s.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
  });
});
