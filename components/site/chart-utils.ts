import type { TimeRange } from "@/types";

export const CHART_RANGES: { value: Exclude<TimeRange, "today">; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
];

export const isMultiDay = (range: TimeRange) => range === "7d";

export const AXIS_STYLE = { fontSize: 12, fill: "hsl(215 19% 35%)" };
export const GRID_STROKE = "hsl(214 28% 88%)";
