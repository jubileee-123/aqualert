/**
 * AquaLert brand palette: a lively lagoon teal paired with warm sand.
 * Teal is the brand colour (buttons, links, charts, the dark sections);
 * sand is its warm complement (page background, soft surfaces, accents on
 * dark teal). Mirrors the `lagoon` and `sand` scales in tailwind.config.ts
 * for places that need raw hex values (charts, SVG, Leaflet).
 *
 * Status colours (green/amber/red/grey) are separate on purpose: they carry
 * safety meaning, so neither brand colour is used to signal risk.
 */
export const LAGOON = {
  50: "#edfcfa",
  100: "#cbf6f0",
  200: "#97ece2",
  300: "#5bdacf",
  400: "#22bfb6",
  500: "#0aa39d",
  600: "#068380",
  700: "#0a6866",
  800: "#0e5352",
  900: "#114545",
  950: "#032a2b",
} as const;

export const SAND = {
  50: "#fbf8f1",
  100: "#f4ecda",
  200: "#e9dab6",
  300: "#dcc48c",
  400: "#cdaa66",
  500: "#bd914a",
  600: "#a2753c",
  700: "#835b33",
  800: "#6c4b2f",
  900: "#5b3f2a",
  950: "#332115",
} as const;
