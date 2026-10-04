import { create } from "zustand";
import type { AlertStatus, TimeRange } from "@/types";

export type OverviewTimeRange = Extract<TimeRange, "today" | "24h" | "7d">;
export type ViewMode = "grid" | "map";

interface OverviewFiltersState {
  siteId: string; // "all" or a siteId
  status: AlertStatus | "all";
  timeRange: OverviewTimeRange;
  view: ViewMode;
  setSiteId: (siteId: string) => void;
  setStatus: (status: AlertStatus | "all") => void;
  setTimeRange: (range: OverviewTimeRange) => void;
  setView: (view: ViewMode) => void;
  reset: () => void;
}

const initial = { siteId: "all", status: "all", timeRange: "24h", view: "grid" } as const;

/** Overview filter state lives outside the URL so it survives navigating to a site and back. */
export const useOverviewFilters = create<OverviewFiltersState>((set) => ({
  ...initial,
  setSiteId: (siteId) => set({ siteId }),
  setStatus: (status) => set({ status }),
  setTimeRange: (timeRange) => set({ timeRange }),
  setView: (view) => set({ view }),
  reset: () => set({ siteId: initial.siteId, status: initial.status, timeRange: initial.timeRange }),
}));
