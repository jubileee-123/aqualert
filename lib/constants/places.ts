/**
 * Accra neighbourhoods people can search for on the landing page, with
 * approximate centre coordinates and a local flood exposure factor.
 *
 * `exposure` scales how strongly the nearest channel's water level affects
 * the area: >1 for low-lying, riverside or poorly drained areas, <1 for
 * higher ground. These are prototype values based on general knowledge of
 * Accra's flood-prone corridors and should be replaced with survey data.
 */
export type ExposureLevel = "very-high" | "high" | "elevated" | "moderate" | "low";

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  exposure: ExposureLevel;
  /** Short reason shown to the user. */
  note: string;
  aliases?: string[];
  /**
   * Sensor site on the channel that actually drains this area, when that is
   * not simply the nearest sensor (e.g. low ground on the lower Odaw).
   */
  channelSiteId?: string;
}

export const EXPOSURE_FACTOR: Record<ExposureLevel, number> = {
  "very-high": 1.35,
  high: 1.2,
  elevated: 1.1,
  moderate: 1.0,
  low: 0.82,
};

export const EXPOSURE_LABEL: Record<ExposureLevel, string> = {
  "very-high": "Very high",
  high: "High",
  elevated: "Above average",
  moderate: "Average",
  low: "Lower",
};

export const PLACES: Place[] = [
  { id: "agbogbloshie", name: "Agbogbloshie", latitude: 5.548, longitude: -0.223, exposure: "very-high", note: "Low-lying ground beside the Odaw and Korle Lagoon.", aliases: ["old fadama"], channelSiteId: "alajo" },
  { id: "alajo", name: "Alajo", latitude: 5.6012, longitude: -0.2265, exposure: "very-high", note: "Right on the Odaw River channel." },
  { id: "kotobabi", name: "Kotobabi", latitude: 5.599, longitude: -0.221, exposure: "high", note: "Close to the Odaw River.", aliases: ["kotobabi down"], channelSiteId: "alajo" },
  { id: "avenor", name: "Avenor", latitude: 5.5935, longitude: -0.2318, exposure: "high", note: "Low ground along an Odaw tributary." },
  { id: "kaneshie", name: "Kaneshie", latitude: 5.5705, longitude: -0.2365, exposure: "high", note: "Busy market area with overloaded storm drains.", aliases: ["kaneshie market"] },
  { id: "abossey-okai", name: "Abossey Okai", latitude: 5.5635, longitude: -0.229, exposure: "high", note: "Flat, built-up area near the Odaw.", channelSiteId: "kaneshie" },
  { id: "circle", name: "Kwame Nkrumah Circle", latitude: 5.5716, longitude: -0.2172, exposure: "high", note: "Major interchange where drains often overtop.", aliases: ["circle", "nkrumah circle", "kwame nkrumah interchange"] },
  { id: "odawna", name: "Odawna", latitude: 5.5745, longitude: -0.219, exposure: "very-high", note: "Beside the Odaw drain near Circle.", channelSiteId: "circle" },
  { id: "korle-gonno", name: "Korle Gonno", latitude: 5.538, longitude: -0.228, exposure: "elevated", note: "Coastal, near the Korle Lagoon outlet." },
  { id: "weija", name: "Weija", latitude: 5.5585, longitude: -0.3335, exposure: "high", note: "Downstream of the Weija dam on the Densu River." },
  { id: "adabraka", name: "Adabraka", latitude: 5.5628, longitude: -0.2105, exposure: "elevated", note: "Feeder drains into the Korle Lagoon." },
  { id: "kokomlemle", name: "Kokomlemle", latitude: 5.581, longitude: -0.2085, exposure: "moderate", note: "Mixed ground with some poorly drained streets." },
  { id: "nima", name: "Nima", latitude: 5.583, longitude: -0.199, exposure: "elevated", note: "Dense housing along the Nima drain." },
  { id: "accra-central", name: "Accra Central", latitude: 5.55, longitude: -0.205, exposure: "moderate", note: "Central business district.", aliases: ["makola", "central accra"] },
  { id: "jamestown", name: "Jamestown", latitude: 5.535, longitude: -0.212, exposure: "moderate", note: "Coastal, partly on higher ground.", aliases: ["james town"] },
  { id: "dansoman", name: "Dansoman", latitude: 5.548, longitude: -0.265, exposure: "moderate", note: "Large residential area with some low spots." },
  { id: "mataheko", name: "Mataheko", latitude: 5.56, longitude: -0.248, exposure: "elevated", note: "Low ground between Kaneshie and Dansoman." },
  { id: "darkuman", name: "Darkuman", latitude: 5.576, longitude: -0.255, exposure: "moderate", note: "Residential, moderate slopes." },
  { id: "odorkor", name: "Odorkor", latitude: 5.573, longitude: -0.276, exposure: "moderate", note: "Residential, moderate slopes." },
  { id: "kwashieman", name: "Kwashieman", latitude: 5.59, longitude: -0.27, exposure: "moderate", note: "Residential, moderate slopes." },
  { id: "abeka", name: "Abeka", latitude: 5.593, longitude: -0.24, exposure: "elevated", note: "Near the Odaw tributaries.", aliases: ["abeka lapaz"] },
  { id: "lapaz", name: "Lapaz", latitude: 5.607, longitude: -0.25, exposure: "moderate", note: "Along the busy N1 corridor." },
  { id: "tesano", name: "Tesano", latitude: 5.599, longitude: -0.233, exposure: "moderate", note: "Close to Avenor and the Odaw tributaries." },
  { id: "achimota", name: "Achimota", latitude: 5.613, longitude: -0.228, exposure: "moderate", note: "Upstream on the Odaw catchment." },
  { id: "mallam", name: "Mallam", latitude: 5.57, longitude: -0.29, exposure: "moderate", note: "Junction area with flash-flood-prone roads.", aliases: ["mallam junction"] },
  { id: "gbawe", name: "Gbawe", latitude: 5.576, longitude: -0.31, exposure: "moderate", note: "Towards the Densu basin." },
  { id: "mccarthy-hill", name: "McCarthy Hill", latitude: 5.555, longitude: -0.305, exposure: "low", note: "Higher ground." },
  { id: "dzorwulu", name: "Dzorwulu", latitude: 5.603, longitude: -0.201, exposure: "moderate", note: "Residential, near the Onyasia stream." },
  { id: "airport", name: "Airport Residential", latitude: 5.604, longitude: -0.18, exposure: "low", note: "Higher, well-drained ground.", aliases: ["airport", "airport residential area"] },
  { id: "east-legon", name: "East Legon", latitude: 5.635, longitude: -0.16, exposure: "moderate", note: "Some streets flood during heavy storms." },
  { id: "legon", name: "Legon", latitude: 5.651, longitude: -0.187, exposure: "low", note: "University area on higher ground.", aliases: ["university of ghana"] },
  { id: "madina", name: "Madina", latitude: 5.683, longitude: -0.166, exposure: "moderate", note: "Busy market town north of Legon." },
  { id: "adenta", name: "Adenta", latitude: 5.707, longitude: -0.155, exposure: "moderate", note: "Northern suburb." },
  { id: "osu", name: "Osu", latitude: 5.556, longitude: -0.182, exposure: "low", note: "Mostly well-drained.", aliases: ["oxford street"] },
  { id: "labone", name: "Labone", latitude: 5.565, longitude: -0.17, exposure: "low", note: "Higher, well-drained ground." },
  { id: "cantonments", name: "Cantonments", latitude: 5.579, longitude: -0.17, exposure: "low", note: "Higher, well-drained ground." },
  { id: "teshie", name: "Teshie", latitude: 5.583, longitude: -0.105, exposure: "moderate", note: "Coastal town east of central Accra." },
  { id: "kasoa", name: "Kasoa", latitude: 5.534, longitude: -0.42, exposure: "moderate", note: "West of the Densu River." },
];

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Local search over the gazetteer: prefix matches first, then substring matches. */
export function searchPlaces(query: string, limit = 6): Place[] {
  const q = normalise(query);
  if (!q) return [];
  const scored: { place: Place; score: number }[] = [];
  for (const place of PLACES) {
    const names = [place.name, ...(place.aliases ?? [])].map(normalise);
    let score = 0;
    for (const n of names) {
      if (n === q) score = Math.max(score, 3);
      else if (n.startsWith(q) || n.split(" ").some((w) => w.startsWith(q))) score = Math.max(score, 2);
      else if (n.includes(q)) score = Math.max(score, 1);
    }
    if (score > 0) scored.push({ place, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((s) => s.place);
}
