/**
 * Static configuration for the monitored sites. Coordinates are approximate
 * locations of the monitored drains/channels in Accra's flood-prone corridors.
 */
export interface SiteConfig {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  nodeId: string;
  /** Sensor mounting height above the channel bed. */
  referenceDistanceCm: number;
  description: string;
}

export const SITE_CONFIGS: SiteConfig[] = [
  {
    siteId: "alajo",
    siteName: "Alajo",
    latitude: 5.6012,
    longitude: -0.2265,
    nodeId: "AQL-N01",
    referenceDistanceCm: 320,
    description: "Odaw River channel at the Alajo bridge.",
  },
  {
    siteId: "kaneshie",
    siteName: "Kaneshie",
    latitude: 5.5705,
    longitude: -0.2365,
    nodeId: "AQL-N02",
    referenceDistanceCm: 280,
    description: "Kaneshie market storm drain near the first light junction.",
  },
  {
    siteId: "avenor",
    siteName: "Avenor",
    latitude: 5.5935,
    longitude: -0.2318,
    nodeId: "AQL-N03",
    referenceDistanceCm: 300,
    description: "Odaw tributary behind the Avenor residential blocks.",
  },
  {
    siteId: "adabraka",
    siteName: "Adabraka",
    latitude: 5.5628,
    longitude: -0.2105,
    nodeId: "AQL-N04",
    referenceDistanceCm: 260,
    description: "Korle Lagoon feeder drain along Kojo Thompson Road.",
  },
  {
    siteId: "circle",
    siteName: "Circle",
    latitude: 5.5716,
    longitude: -0.2172,
    nodeId: "AQL-N05",
    referenceDistanceCm: 250,
    description: "Kwame Nkrumah Circle interchange storm drain.",
  },
  {
    siteId: "weija",
    siteName: "Weija",
    latitude: 5.5585,
    longitude: -0.3335,
    nodeId: "AQL-N06",
    referenceDistanceCm: 360,
    description: "Densu River downstream of the Weija dam spillway.",
  },
];

/** Map centre for the overview map (central Accra). */
export const MAP_CENTER: [number, number] = [5.576, -0.27];
export const MAP_ZOOM = 13;
