import { create } from "zustand";
import { TOUR_STEPS } from "@/lib/tour/steps";

const STORAGE_KEY = "aqualert-tour-completed-v1";

/** localStorage can throw (private mode, blocked storage); the tour just shows again in that case. */
export function hasCompletedTour(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markCompleted() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Ignore: worst case the tour offers itself again next visit.
  }
}

interface TourState {
  active: boolean;
  index: number;
  start: () => void;
  next: () => void;
  back: () => void;
  /** Ends the tour (skip or finish) and remembers it so it does not auto-start again. */
  end: () => void;
}

export const useTour = create<TourState>((set, get) => ({
  active: false,
  index: 0,
  start: () => set({ active: true, index: 0 }),
  next: () => {
    const { index } = get();
    if (index >= TOUR_STEPS.length - 1) get().end();
    else set({ index: index + 1 });
  },
  back: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
  end: () => {
    markCompleted();
    set({ active: false, index: 0 });
  },
}));
