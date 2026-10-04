import type { TimeRange } from "@/types";

export const CHART_RANGES: { value: Exclude<TimeRange, "today">; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
];

export const isMultiDay = (range: TimeRange) => range === "7d";

export const AXIS_STYLE = { fontSize: 12, fill: "hsl(203 30% 32%)" };
export const GRID_STROKE = "hsl(199 35% 88%)";
