import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AlertEvent } from "@/types";
import { RiskBadge } from "@/components/status/status-badge";
import { formatDateTime } from "@/lib/format";

export function RecentAlertsList({ alerts, limit = 6 }: { alerts: AlertEvent[]; limit?: number }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-muted-foreground">No alerts for this site in the last 7 days.</p>;
  }
  return (
    <ol className="divide-y" aria-label="Recent alerts">
      {alerts.slice(0, limit).map((a) => (
        <li key={a.alertId}>
          <Link
            href={`/alerts?alertId=${encodeURIComponent(a.alertId)}`}
            className="group flex items-start gap-3 rounded-md px-1 py-3 hover:bg-muted/50"
          >
            <RiskBadge status={a.alertStatus} size="sm" className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                <time dateTime={a.alertCreatedAtUtc}>{formatDateTime(a.alertCreatedAtUtc)}</time>
              </span>
              <span className="line-clamp-2 block text-xs text-muted-foreground">{a.triggerReason}</span>
            </span>
            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
            <span className="sr-only">View alert {a.alertId}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
