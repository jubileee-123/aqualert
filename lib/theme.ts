/**
 * AquaLert brand palette: one rich ocean blue used across the whole UI.
 * Mirrors the `ocean` scale in tailwind.config.ts for places that need raw
 * hex values (charts, SVG, Leaflet). Status colours (green/amber/red/grey)
 * are separate on purpose: they carry safety meaning.
 */
export const OCEAN = {
  50: "#eef8fc",
  100: "#d5eef8",
  200: "#addcf0",
  300: "#75c2e4",
  400: "#36a1d2",
  500: "#1484b8",
  600: "#0a6a9b",
  700: "#0b567e",
  800: "#0e4767",
  900: "#103b55",
  950: "#0a2639",
} as const;
