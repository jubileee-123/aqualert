# AquaLert Dashboard

Live flood-monitoring dashboard for **AquaLert**, a community flood early-warning network for Accra, Ghana. It shows water level, rainfall intensity, rise rate and node health for each monitoring site, the current risk status (Normal / Watch / Warning), and a full alert history with the SMS, WhatsApp and dashboard notification trail behind every alert.

This is a hackathon prototype. It ships with a realistic **simulated** data source and is built so the real backend can be connected without changing any screens.

## Run it locally

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

pnpm works too (`pnpm install`, `pnpm dev`).

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Development server                            |
| `npm run build`     | Production build                              |
| `npm start`         | Serve the production build                    |
| `npm test`          | Vitest + React Testing Library suite          |
| `npm run lint`      | ESLint (Next.js rules)                        |
| `npm run typecheck` | TypeScript in strict mode                     |

Deploys to Vercel as-is (no extra configuration).

## Pages

| Route              | Purpose                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Live overview: summary bar, filters (site, status, time range), site cards with sparkline, or a map view with colour-coded markers.  |
| `/sites/[siteId]`  | Site detail: current status, key readings, node health, water level and rainfall charts with threshold lines (1h/6h/24h/7d), alerts. |
| `/alerts`          | Alert history: search, site/level/date filters, table, and a detail dialog with trigger values, message text and notification log.   |
| `/about`           | How AquaLert works, how statuses are decided, and the thresholds for every site.                                                      |

`/alerts?alertId=…` opens a specific alert directly (used by the site page's "Recent alerts" list).

## Project structure

```
app/                     Next.js App Router pages and layout
  api/                   REST route handlers serving the mock data (same contract as the real backend)
components/
  ui/                    shadcn/ui primitives (button, card, badge, table, select, dialog, …)
  overview/ site/ alerts/ Page-specific components
  status/                Risk and node status badges (icon + text + colour)
  common/                Metric, sparkline, segmented control, empty/error states
lib/
  api/                   API contract, mock implementation, HTTP client
    mock/                Scenarios, data generator, in-memory store
  constants/             Thresholds, timing, site configuration, runtime config
  hooks/                 TanStack Query hooks and query keys
  store/                 Zustand store for overview filters
  alert-logic.ts         Normal / Watch / Warning rules
types/                   Shared TypeScript types (AquaLert data dictionary)
tests/                   Vitest test suite
```

## Swapping the mock for the real backend

All screens talk to one interface, `AquaLertApi` in `lib/api/types.ts`:

```ts
getSites()                               getAlertHistory(siteId?, timeRange?)
getSite(siteId)                          getAlertById(alertId)
getLatestReadingsBySite(siteId)          getNotificationsByAlert(alertId)
getReadingsTimeSeries(siteId, timeRange)
```

`lib/api/index.ts` picks the implementation from environment variables (see `.env.example`):

```bash
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=https://your-aqualert-backend.example/api
```

In `http` mode the client (`lib/api/http-api.ts`) calls these routes:

| Method + path                                | Returns                         |
| -------------------------------------------- | ------------------------------- |
| `GET /sites`                                 | `Site[]`                        |
| `GET /sites/:siteId`                         | `Site` (404 if unknown)         |
| `GET /sites/:siteId/readings/latest`         | `SensorReading`                 |
| `GET /sites/:siteId/readings?range=24h`      | `SensorReading[]` (oldest first)|
| `GET /alerts?siteId=&range=` or `&from=&to=` | `AlertEvent[]` (newest first)   |
| `GET /alerts/:alertId`                       | `AlertEvent`                    |
| `GET /alerts/:alertId/notifications`         | `NotificationLog[]`             |

`range` is one of `1h`, `6h`, `24h`, `7d`, `today`; `from`/`to` are ISO 8601 UTC timestamps. Response shapes are the TypeScript types in `types/index.ts`, which follow the AquaLert data dictionary.

The bundled route handlers in `app/api` implement exactly this contract over the mock data, so `NEXT_PUBLIC_API_MODE=http` with `NEXT_PUBLIC_API_BASE_URL=/api` works out of the box and is a good way to test the HTTP path before the backend is ready. If the backend's field names differ, adapt them in `http-api.ts` only.

## Thresholds and site configuration

- **Thresholds:** `lib/constants/thresholds.ts`. `DEFAULT_THRESHOLDS` holds the watch level, danger level, watch rainfall intensity and rapid-rise rate; `SITE_THRESHOLD_OVERRIDES` overrides any of them per site. `ALERT_TIMING` holds the reading interval, the Watch confirmation period, hysteresis, and when a node counts as Stale (15 min) or Offline (60 min).
- **Sites:** `lib/constants/sites.ts` (name, node ID, coordinates, sensor mounting height, description).
- **Refresh rate:** `lib/constants/config.ts` (`LIVE_REFETCH_MS`, default 30 s).

## Alert logic

`lib/alert-logic.ts` mirrors the backend decision engine so charts, legends and mock data agree:

- **Normal:** water level, rainfall and rise rate below thresholds.
- **Watch:** level at or above the watch line, or rainfall above the watch intensity sustained for the confirmation period (15 min).
- **Warning:** level above the danger line and rising faster than the rapid-rise rate. Warning holds while the level stays at the danger line.
- Statuses are lowered only after the level drops a few cm below the line and rain stays light for the confirmation period, so they do not flicker. Readings flagged `SUSPECT` are charted but ignored.

## Mock data

`lib/api/mock/scenarios.ts` defines Accra rainy-season storms per site; `generator.ts` turns them into 5-minute readings with a simple catchment model (fast rise in heavy rain, slow recession), tipping-bucket rain quantisation, sensor noise, occasional echo spikes, solar battery cycles and radio latency. Alerts and notification logs are derived from the same series. Storm times are relative to when the app starts, so a storm is always in progress on first load:

- **Alajo:** Normal → Watch → Warning during the current storm.
- **Kaneshie:** Watch (sustained rain); reached Warning two days ago.
- **Avenor, Adabraka:** Normal, with past Watch events.
- **Circle:** node Stale (stopped reporting mid-storm, last known Watch).
- **Weija:** node Offline (battery ran down hours ago).

Some SMS/WhatsApp sends fail and are retried, so the notification log shows realistic delivery trails.

## Accessibility

Status is always shown as colour + icon + text; status colours meet WCAG AA contrast on their backgrounds. All controls are keyboard-operable with visible focus rings, there is a skip link, charts include text summaries for screen readers, and motion is reduced when the user prefers it. The map uses OpenStreetMap tiles and needs internet access; the grid view and site list work without it.
