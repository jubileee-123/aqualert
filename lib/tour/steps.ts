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

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    path: "/",
    title: "Welcome to AquaLert",
    body: "AquaLert watches drains and rivers across Accra with low-cost sensors and warns communities before flooding. This two-minute tour shows you what each part of the dashboard does and how to get the most out of it.",
  },
  {
    id: "statuses",
    path: "/",
    title: "Three levels of flood risk",
    body: "Every site is always in one of three states. Colour, icon and word always appear together, so you can read them at a glance.",
    points: [
      "Normal (green): water and rain are below the site's limits.",
      "Watch (amber): water is rising or heavy rain has lasted 15+ minutes. Get ready.",
      "Warning (red): water is above the danger line and rising fast. Act now.",
      "Grey means a sensor has stopped reporting, so its status is the last one we know.",
    ],
  },
  {
    id: "summary",
    path: "/",
    target: sel("summary"),
    title: "The situation in one line",
    body: "Start here. These tiles count how many sensors are reporting and how many sites are Normal, on Watch or on Warning. A red banner appears whenever any site is on Warning.",
  },
  {
    id: "refresh",
    path: "/",
    target: sel("refresh"),
    title: "Always live",
    body: "Data refreshes by itself every 30 seconds. This shows when it last updated; press Refresh to fetch the latest readings immediately.",
  },
  {
    id: "filters",
    path: "/",
    target: sel("filters"),
    title: "Focus on what matters",
    body: "Narrow the view to one site or one status, for example only sites on Warning. The time range changes the trend line and alert count on each card.",
    onEnter: gridView,
  },
  {
    id: "view-toggle",
    path: "/",
    target: sel("view-toggle"),
    title: "Grid or map",
    body: "Switch to the map to see where each site is in Accra, with markers coloured by status. Tap a marker for its readings and a link to the site.",
    onEnter: gridView,
  },
  {
    id: "site-card",
    path: "/",
    target: sel("site-card"),
    title: "Reading a site card",
    body: "Each card is one sensor site, with the most urgent sites first.",
    points: [
      "Water: depth in the channel, in centimetres.",
      "Rain: how hard it is raining right now, in mm per hour.",
      "Rise: how fast the water is climbing. Fast rises are the main danger sign.",
      "The small chart shows the trend, with dashed watch and danger lines.",
    ],
    onEnter: gridView,
  },
  {
    id: "current-condition",
    path: `/sites/${TOUR_SITE_ID}`,
    target: sel("current-condition"),
    title: "Site details: right now",
    body: "Opening a site shows its status in large type, how long it has been at that level, and the key readings compared with this site's own limits.",
  },
  {
    id: "node-health",
    path: `/sites/${TOUR_SITE_ID}`,
    target: sel("node-health"),
    title: "Is the sensor healthy?",
    body: "Check battery, radio signal and the last transmission time. If a node goes Stale or Offline, its readings may be out of date and someone should check it.",
  },
  {
    id: "trends",
    path: `/sites/${TOUR_SITE_ID}`,
    target: sel("trends"),
    title: "Trends over time",
    body: "Pick 1 hour to 7 days. The water chart shows the watch and danger lines; the rain chart shows when rain crossed the watch intensity. Hover or tap for exact values.",
  },
  {
    id: "recent-alerts",
    path: `/sites/${TOUR_SITE_ID}`,
    target: sel("recent-alerts"),
    title: "What happened here",
    body: "Every status change at this site, newest first. Select one to see exactly why it was raised and who was notified.",
  },
  {
    id: "alert-filters",
    path: "/alerts",
    target: sel("alert-filters"),
    title: "Alerts and history",
    body: "Every alert across all sites. Search by alert ID or site, or filter by site, level and date range, for example to review last night's storm.",
  },
  {
    id: "alert-table",
    path: "/alerts",
    target: sel("alert-table"),
    title: "Proof that people were told",
    body: "Select any row to open the alert: the readings that triggered it, the exact message sent, and a delivery log for every SMS, WhatsApp and dashboard notice, including failed sends and retries.",
  },
  {
    id: "about",
    path: "/alerts",
    target: sel("nav-about"),
    title: "How the rules work",
    body: "The About page explains how Normal, Watch and Warning are decided and lists each site's limits.",
  },
  {
    id: "done",
    path: "/",
    title: "You're ready",
    body: "That's the whole system. You can replay this tour any time from the Tour button at the top of the page. In an emergency, always call 112.",
  },
];
