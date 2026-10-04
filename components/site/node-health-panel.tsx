import { Battery, BatteryLow, Signal, Clock, Radio } from "lucide-react";
import type { SensorReading, Site } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NodeStatusBadge } from "@/components/status/status-badge";
import { LOW_BATTERY_V, WEAK_SIGNAL_DBM } from "@/lib/constants/thresholds";
import { NODE_META } from "@/lib/status";
import { formatDateTime, formatRelative, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NodeHealthPanel({ site, reading, nowMs }: { site: Site; reading: SensorReading | null; nowMs: number }) {
  const lowBattery = reading ? reading.batteryVoltageV < LOW_BATTERY_V : false;
  const weakSignal = reading ? reading.signalStrength < WEAK_SIGNAL_DBM : false;
  const rows = [
    {
      icon: Radio,
      label: "Node",
      value: (
        <span className="flex flex-wrap items-center justify-end gap-2">
          <span className="font-mono text-xs">{site.nodeId}</span>
          <NodeStatusBadge status={site.status} />
        </span>
      ),
    },
    {
      icon: lowBattery ? BatteryLow : Battery,
      label: "Battery",
      value: reading ? (
        <span className={cn(lowBattery && "font-semibold text-status-warning")}>
          {reading.batteryVoltageV.toFixed(2)} V{lowBattery && " (low)"}
        </span>
      ) : (
        "—"
      ),
    },
    {
      icon: Signal,
      label: "Signal",
      value: reading ? (
        <span className={cn(weakSignal && "font-semibold text-status-watch")}>
          {reading.signalStrength} dBm{weakSignal && " (weak)"}
        </span>
      ) : (
        "—"
      ),
    },
    {
      icon: Clock,
      label: "Last transmission",
      value: reading ? (
        <span className="text-right">
          {formatDateTime(reading.receivedAtUtc)}
          <span className="block text-xs text-muted-foreground">
            {formatRelative(reading.receivedAtUtc, nowMs)} · {titleCase(reading.transmissionStatus)}
          </span>
        </span>
      ) : (
        "Never"
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Node health</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {site.status !== "ONLINE" && (
          <p className="mt-3 rounded-md bg-status-offline-bg px-3 py-2 text-xs font-medium text-status-offline">
            {NODE_META[site.status].description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
