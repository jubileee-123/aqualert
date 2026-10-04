import { useOverviewFilters } from "@/lib/store/overview-filters";

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Page the step lives on. The tour navigates there before showing it. */
  path: string;
  /** CSS selector of the element to highlight; omitted for centred steps. */
  target?: string;
  /** Optional bullet points shown under the body. */
  points?: string[];
  /** Runs before the step is shown (e.g. switch the overview to grid view). */
  onEnter?: () => void;
}

/** Site used for the detail-page part of the tour: the one most likely to be on Warning in the demo data. */
export const TOUR_SITE_ID = "alajo";

const sel = (id: string) => `[data-tour="${id}"]`;
const gridView = () => useOverviewFilters.getState().setView("grid");

/**
 * Kept deliberately short: only what a first-time user must know to read the
 * dashboard and act on it. Everything else is discoverable on the pages.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    path: "/dashboard",
    title: "Welcome to AquaLert",
    body: "AquaLert watches drains and rivers across Accra and warns communities before flooding. Take a quick five-step tour, or skip it and explore on your own.",
  },
  {
    id: "statuses",
    path: "/dashboard",
    target: sel("summary"),
    title: "Three levels of flood risk",
    body: "These tiles count how many sites are at each level. Colour, icon and word always appear together.",
    points: [
      "Normal (green): water and rain are below the site's limits.",
      "Watch (amber): water is rising or heavy rain has lasted 15+ minutes. Get ready.",
      "Warning (red): water is above the danger line and rising fast. Act now.",
      "Grey: the sensor has stopped reporting, so its status is the last one known.",
    ],
  },
  {
    id: "site-card",
    path: "/dashboard",
    target: sel("site-card"),
    title: "Reading a site",
    body: "Each card is one sensor site, most urgent first. Water is the depth in the channel, Rain is how hard it is raining, and Rise is how fast the water is climbing, which is the main danger sign. Press View details for the full picture.",
    onEnter: gridView,
  },
  {
    id: "trends",
    path: `/sites/${TOUR_SITE_ID}`,
    target: sel("trends"),
    title: "Is it getting worse?",
    body: "On a site's page, these charts show water level and rain over time against the watch and danger lines. Hover or tap for exact values.",
  },
  {
    id: "alert-table",
    path: "/alerts",
    target: sel("alert-table"),
    title: "Every alert, and who was told",
    body: "Select any alert to see why it was raised and the delivery record for every SMS and WhatsApp message sent. Replay this tour any time from the Tour button at the top.",
  },
];
