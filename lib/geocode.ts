import type { Place } from "@/lib/constants/places";

/**
 * Fallback geocoder for places not in the local gazetteer. Uses OpenStreetMap
 * Nominatim (free, no key), limited to Greater Accra. Nominatim's usage
 * policy allows light, user-initiated lookups like this one; switch to a
 * paid geocoder before heavy production use.
 */
const ACCRA_VIEWBOX = "-0.45,5.85,0.05,5.45"; // left,top,right,bottom

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

export async function geocodeAccra(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    countrycodes: "gh",
    viewbox: ACCRA_VIEWBOX,
    bounded: "1",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Location search failed (${res.status})`);
  const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return rows.map((r) => ({
    name: r.display_name.split(",").slice(0, 2).join(",").trim(),
    latitude: Number(r.lat),
    longitude: Number(r.lon),
  }));
}

/** A searched or GPS location is treated as average exposure (we don't know its terrain). */
export function toPlace(r: GeocodeResult, id: string): Place {
  return {
    id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    exposure: "moderate",
    note: "Terrain not surveyed yet, so we assume average exposure.",
  };
}
