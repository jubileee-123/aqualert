import { CheckCheck, CircleX, Hourglass, Send, MessageSquare, MessageCircle, Monitor } from "lucide-react";
import type { NotificationChannel, NotificationLog, NotificationStatus, RecipientGroup } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHANNEL: Record<NotificationChannel, { label: string; icon: typeof Send }> = {
  SMS: { label: "SMS", icon: MessageSquare },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  DASHBOARD: { label: "Dashboard", icon: Monitor },
};

const GROUP_LABEL: Record<RecipientGroup, string> = {
  RESIDENTS: "Residents",
  LEADERS: "Community leaders",
  NADMO: "NADMO",
  PUBLIC: "Public",
};

const STATUS: Record<NotificationStatus, { icon: typeof Send; className: string }> = {
  QUEUED: { icon: Hourglass, className: "text-muted-foreground" },
  SENT: { icon: Send, className: "text-primary" },
  DELIVERED: { icon: CheckCheck, className: "text-status-normal" },
  FAILED: { icon: CircleX, className: "text-status-warning" },
};

export function NotificationLogTable({ logs }: { logs: NotificationLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No notifications were recorded for this alert.</p>;
  }
  return (
    <Table aria-label="Notification log">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col">Channel</TableHead>
          <TableHead scope="col">Recipients</TableHead>
          <TableHead scope="col">Sent (UTC)</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Provider ref.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((n) => {
          const ch = CHANNEL[n.channel];
          const st = STATUS[n.notificationStatus];
          return (
            <TableRow key={n.notificationId}>
              <TableCell className="whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ch.icon className="size-4" aria-hidden="true" />
                  {ch.label}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {GROUP_LABEL[n.recipientGroup]}
                <span className="block text-[11px] text-muted-foreground">
                  {n.recipientCount.toLocaleString("en-GB")} recipient{n.recipientCount === 1 ? "" : "s"}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(n.sentAtUtc)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <span className={cn("inline-flex items-center gap-1.5 font-semibold", st.className)}>
                  <st.icon className="size-4" aria-hidden="true" />
                  {titleCase(n.notificationStatus)}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                {n.providerReference ?? "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/**
 * Traceability check: a Warning must have SMS and WhatsApp records, and every
 * failed send should be followed by a successful retry on the same channel/group.
 */
export function summariseDelivery(logs: NotificationLog[]) {
  const key = (n: NotificationLog) => `${n.channel}:${n.recipientGroup}`;
  const groups = new Map<string, NotificationLog[]>();
  for (const n of logs) groups.set(key(n), [...(groups.get(key(n)) ?? []), n]);
  let delivered = 0;
  let pending = 0;
  let failed = 0;
  for (const attempts of groups.values()) {
    const final = attempts.reduce((a, b) => (a.sentAtUtc >= b.sentAtUtc ? a : b));
    if (final.notificationStatus === "DELIVERED") delivered++;
    else if (final.notificationStatus === "FAILED") failed++;
    else pending++;
  }
  return {
    targets: groups.size,
    delivered,
    pending,
    failed,
    hasSms: logs.some((n) => n.channel === "SMS"),
    hasWhatsApp: logs.some((n) => n.channel === "WHATSAPP"),
    retries: logs.filter((n) => n.notificationStatus === "FAILED").length,
  };
}
