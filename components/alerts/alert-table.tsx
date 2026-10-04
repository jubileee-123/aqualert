"use client";

import { memo } from "react";
import { Eye } from "lucide-react";
import type { AlertEvent } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/status/status-badge";
import { RISK_META } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AlertTableProps {
  alerts: AlertEvent[];
  siteNames: Record<string, string>;
  onSelect: (alertId: string) => void;
  selectedId?: string | null;
}

export const AlertTable = memo(function AlertTable({ alerts, siteNames, onSelect, selectedId }: AlertTableProps) {
  return (
    <Table aria-label="Alert history">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col">Alert ID</TableHead>
          <TableHead scope="col">Time (UTC)</TableHead>
          <TableHead scope="col">Location</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="min-w-[16rem]">Trigger reason</TableHead>
          <TableHead scope="col" className="text-right">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((a) => (
          <TableRow
            key={a.alertId}
            data-state={a.alertId === selectedId ? "selected" : undefined}
            onClick={() => onSelect(a.alertId)}
            className={cn(
              "cursor-pointer",
              a.alertStatus === "WARNING" && "bg-status-warning-bg/40",
            )}
          >
            <TableCell className="whitespace-nowrap font-mono text-xs">{a.alertId}</TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              <time dateTime={a.alertCreatedAtUtc}>{formatDateTime(a.alertCreatedAtUtc)}</time>
            </TableCell>
            <TableCell className="whitespace-nowrap font-medium">{siteNames[a.siteId] ?? a.siteId}</TableCell>
            <TableCell className="whitespace-nowrap">
              <RiskBadge status={a.alertStatus} size="sm" />
              {a.previousAlertStatus && (
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  from {RISK_META[a.previousAlertStatus].label}
                </span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              <span className="line-clamp-2">{a.triggerReason}</span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(a.alertId);
                }}
                aria-label={`View alert ${a.alertId}`}
              >
                <Eye aria-hidden="true" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
