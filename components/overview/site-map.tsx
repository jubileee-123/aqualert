"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { SiteOverview } from "@/types";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/constants/sites";
import { RISK_META as RM } from "@/lib/status";
import { NODE_META, OFFLINE_HEX, RISK_META } from "@/lib/status";
import { formatNumber } from "@/lib/format";

/**
 * Leaflet map of the monitored sites. Loaded client-side only (see
 * SiteMapLazy) because Leaflet touches `window` on import.
 */
export default function SiteMap({ overviews }: { overviews: SiteOverview[] }) {
  return (
    <MapContainer
      {...(overviews.length > 1
        ? {
            bounds: overviews.map((o) => [o.site.latitude, o.site.longitude] as [number, number]),
            boundsOptions: { padding: [40, 40] as [number, number] },
          }
        : {
            center: overviews[0] ? ([overviews[0].site.latitude, overviews[0].site.longitude] as [number, number]) : MAP_CENTER,
            zoom: MAP_ZOOM,
          })}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Draw the most urgent markers last so they sit on top. */}
      {[...overviews]
        .sort((a, b) => RM[a.riskStatus].rank - RM[b.riskStatus].rank)
        .map(({ site, riskStatus, latestReading }) => {
        const reporting = site.status === "ONLINE";
        const color = reporting ? RISK_META[riskStatus].hex : OFFLINE_HEX;
        return (
          <CircleMarker
            key={site.siteId}
            center={[site.latitude, site.longitude]}
            radius={riskStatus === "WARNING" ? 14 : 11}
            pathOptions={{
              color: "#fff",
              weight: 3,
              fillColor: color,
              fillOpacity: 0.95,
              dashArray: reporting ? undefined : "4 3",
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <span className="text-xs font-semibold">
                {site.siteName}: {RISK_META[riskStatus].label}
                {!reporting && ` (${NODE_META[site.status].label})`}
              </span>
            </Tooltip>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="text-base font-bold">{site.siteName}</p>
                <p>
                  Status: <strong>{RISK_META[riskStatus].label}</strong>
                  {!reporting && ` (last known, node ${NODE_META[site.status].label.toLowerCase()})`}
                </p>
                {latestReading && (
                  <p>
                    Water {formatNumber(latestReading.waterLevelCm)} cm · Rain{" "}
                    {formatNumber(latestReading.rainfallRateMmHr, 1)} mm/hr
                  </p>
                )}
                <Link href={`/sites/${site.siteId}`} className="font-semibold text-primary underline">
                  View details
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
        })}
    </MapContainer>
  );
}
