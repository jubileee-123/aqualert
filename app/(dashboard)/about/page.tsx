import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/status/status-badge";
import { SITE_CONFIGS } from "@/lib/constants/sites";
import { ALERT_TIMING, getThresholds } from "@/lib/constants/thresholds";

export const metadata: Metadata = { title: "About & methodology" };

export default function AboutPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="About AquaLert"
        description="A community flood early-warning network for Accra's flood-prone corridors. Hackathon prototype."
      />

      <Card>
        <CardHeader>
          <CardTitle>What it does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            Low-cost sensor nodes mounted over drains and river channels in Alajo, Kaneshie, Avenor, Adabraka, Circle and
            Weija measure the distance to the water surface with an ultrasonic sensor and count rain with a tipping-bucket
            gauge. Each node transmits a reading every {ALERT_TIMING.readingIntervalMinutes} minutes.
          </p>
          <p>
            The AquaLert engine turns those readings into a simple status for each site and, when the status changes,
            sends SMS and WhatsApp messages to residents, community leaders and NADMO, and updates this public dashboard.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How the status is decided</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4 text-sm leading-relaxed">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0"><RiskBadge status="NORMAL" /></dt>
              <dd>Water level, rainfall and rise rate are all below the site&apos;s thresholds.</dd>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0"><RiskBadge status="WATCH" /></dt>
              <dd>
                The water level reaches the Watch line, <em>or</em> rainfall stays above the Watch intensity for at least{" "}
                {ALERT_TIMING.watchConfirmationMinutes} minutes (the confirmation period, which filters out short bursts).
              </dd>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0"><RiskBadge status="WARNING" /></dt>
              <dd>
                The water level is above the danger line <em>and</em> rising faster than the rapid-rise rate. Warning holds
                until the level falls back below the danger line.
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            To stop the status flickering, a level has to fall {ALERT_TIMING.clearHysteresisCm} cm below a line, and rain
            has to stay light for {ALERT_TIMING.watchConfirmationMinutes} minutes, before the status is lowered. Readings
            the node flags as suspect (for example an echo off floating debris) are shown on charts but ignored by the
            engine. A node with no reading for {ALERT_TIMING.staleAfterMinutes} minutes is marked <strong>Stale</strong>{" "}
            and after {ALERT_TIMING.offlineAfterMinutes} minutes <strong>Offline</strong>; its last known status is shown in
            grey.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thresholds by site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Thresholds are configurable and site-specific: channel depth, bank height and local flood history differ from
            site to site.
          </p>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col">Site</TableHead>
                <TableHead scope="col" className="text-right">Watch level</TableHead>
                <TableHead scope="col" className="text-right">Danger level</TableHead>
                <TableHead scope="col" className="text-right">Watch rain</TableHead>
                <TableHead scope="col" className="text-right">Rapid rise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SITE_CONFIGS.map((s) => {
                const t = getThresholds(s.siteId);
                return (
                  <TableRow key={s.siteId}>
                    <TableCell className="font-medium">{s.siteName}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.waterWatchThresholdCm} cm</TableCell>
                    <TableCell className="text-right tabular-nums">{t.waterWarningThresholdCm} cm</TableCell>
                    <TableCell className="text-right tabular-nums">{t.rainfallWatchThresholdMmHr} mm/hr</TableCell>
                    <TableCell className="text-right tabular-nums">{t.riseWarningThresholdCmMin} cm/min</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About this prototype</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            This dashboard was built for a hackathon and currently shows <strong>simulated rainy-season data</strong>. The
            data layer follows the AquaLert data dictionary, so it can be connected to the live backend without changing
            the screens.
          </p>
          <p>
            AquaLert supports, and does not replace, official warnings from NADMO and the Ghana Meteorological Agency. In
            an emergency call <strong>112</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
