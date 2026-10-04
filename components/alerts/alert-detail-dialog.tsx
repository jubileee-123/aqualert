"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";
import type { AlertEvent } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/status/status-badge";
import { useAlert, useNotifications } from "@/lib/hooks/queries";
import { RISK_META } from "@/lib/status";
import { formatDateTime, formatNumber, formatRise } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NotificationLogTable, summariseDelivery } from "./notification-log-table";
import Link from "next/link";

interface Props {
  alertId: string | null;
  siteNames: Record<string, string>;
  onOpenChange: (open: boolean) => void;
}

function TriggerValues({ alert }: { alert: AlertEvent }) {
  const rows = [
    {
      label: "Water level",
      value: `${formatNumber(alert.triggerWaterLevelCm, 1)} cm`,
      threshold: `Watch ${alert.waterWatchThresholdCm} cm · Danger ${alert.waterWarningThresholdCm} cm`,
      over: alert.triggerWaterLevelCm >= alert.waterWatchThresholdCm,
    },
    {
      label: "Rainfall rate",
      value: `${formatNumber(alert.triggerRainfallRateMmHr, 1)} mm/hr`,
      threshold: `Watch ${alert.rainfallWatchThresholdMmHr} mm/hr (15 min)`,
      over: alert.triggerRainfallRateMmHr >= alert.rainfallWatchThresholdMmHr,
    },
    {
      label: "Rise rate",
      value: `${formatRise(alert.triggerRiseRateCmMin)} cm/min`,
      threshold: `Rapid rise ${alert.riseWarningThresholdCmMin} cm/min`,
      over: alert.triggerRiseRateCmMin >= alert.riseWarningThresholdCmMin,
    },
  ];
  return (
    <dl className="grid gap-2 sm:grid-cols-3">
      {rows.map((r) => (
        <div key={r.label} className={cn("rounded-md border p-3", r.over && "border-status-watch/40 bg-status-watch-bg/50")}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.label}</dt>
          <dd>
            <span className="text-lg font-bold tabular-nums">{r.value}</span>
            {r.over && <span className="ml-1.5 text-xs font-semibold text-status-watch">over limit</span>}
            <span className="block text-xs text-muted-foreground">{r.threshold}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AlertDetailDialog({ alertId, siteNames, onOpenChange }: Props) {
  const alert = useAlert(alertId);
  const logs = useNotifications(alertId);
  const a = alert.data;
  const delivery = logs.data ? summariseDelivery(logs.data) : null;
  const missingChannels =
    a?.alertStatus === "WARNING" && delivery && (!delivery.hasSms || !delivery.hasWhatsApp);

  return (
    <Dialog open={!!alertId} onOpenChange={onOpenChange}>
      <DialogContent>
        {alert.isPending || !a ? (
          <>
            <DialogHeader>
              <DialogTitle>{alert.isPending ? "Loading alert" : "Alert not found"}</DialogTitle>
              <DialogDescription>{alertId}</DialogDescription>
            </DialogHeader>
            {alert.isPending && <Skeleton className="h-64" />}
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge status={a.alertStatus} />
                {a.previousAlertStatus && (
                  <span className="text-xs text-muted-foreground">
                    raised from {RISK_META[a.previousAlertStatus].label}
                  </span>
                )}
              </div>
              <DialogTitle className="pt-1 text-xl">
                {siteNames[a.siteId] ?? a.siteId}: {RISK_META[a.alertStatus].label === "Normal" ? "All clear" : RISK_META[a.alertStatus].label}
              </DialogTitle>
              <DialogDescription>
                Alert <span className="font-mono">{a.alertId}</span> · created {formatDateTime(a.alertCreatedAtUtc)}
              </DialogDescription>
            </DialogHeader>

            <section aria-labelledby="trigger-heading" className="space-y-2">
              <h3 id="trigger-heading" className="text-sm font-semibold">
                Why this alert was raised
              </h3>
              <p className="text-sm">{a.triggerReason}</p>
              <TriggerValues alert={a} />
            </section>

            <section aria-labelledby="message-heading" className="space-y-2">
              <h3 id="message-heading" className="text-sm font-semibold">
                Message sent
              </h3>
              {logs.data?.[0] ? (
                <blockquote className="max-w-prose rounded-lg rounded-tl-none border bg-muted/60 p-3 text-sm leading-relaxed">
                  {logs.data[0].messageText}
                </blockquote>
              ) : (
                <Skeleton className="h-16" />
              )}
            </section>

            <section aria-labelledby="log-heading" className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="log-heading" className="text-sm font-semibold">
                  Notification log
                </h3>
                {delivery && (
                  <p
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold",
                      delivery.failed > 0 || missingChannels ? "text-status-warning" : "text-status-normal",
                    )}
                  >
                    {delivery.failed > 0 || missingChannels ? (
                      <TriangleAlert className="size-4" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    )}
                    {delivery.delivered}/{delivery.targets} recipient groups reached
                    {delivery.pending > 0 && `, ${delivery.pending} in progress`}
                    {delivery.retries > 0 && ` (${delivery.retries} retried)`}
                  </p>
                )}
              </div>
              {missingChannels && (
                <p role="alert" className="rounded-md bg-status-warning-bg px-3 py-2 text-xs font-semibold text-status-warning">
                  Traceability gap: this Warning has no {delivery?.hasSms ? "WhatsApp" : "SMS"} notification record.
                </p>
              )}
              {logs.isPending ? <Skeleton className="h-40" /> : <NotificationLogTable logs={logs.data ?? []} />}
            </section>

            <p className="text-xs">
              <Link href={`/sites/${a.siteId}`} className="font-semibold text-primary underline underline-offset-2">
                Open {siteNames[a.siteId] ?? a.siteId} site details
              </Link>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
