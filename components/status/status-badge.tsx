import { CircleCheck, OctagonAlert, TriangleAlert, WifiOff, Clock, Radio } from "lucide-react";
import type { AlertStatus, NodeStatus } from "@/types";
import { NODE_META, RISK_META } from "@/lib/status";
import { cn } from "@/lib/utils";

const RISK_ICON = { NORMAL: CircleCheck, WATCH: TriangleAlert, WARNING: OctagonAlert } as const;
const NODE_ICON = { ONLINE: Radio, STALE: Clock, OFFLINE: WifiOff } as const;

interface RiskBadgeProps {
  status: AlertStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Flood-risk badge. Icon + text so status never relies on colour alone. */
export function RiskBadge({ status, size = "md", className }: RiskBadgeProps) {
  const meta = RISK_META[status];
  const Icon = RISK_ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        size === "sm" && "px-2 py-0.5 text-[11px] [&_svg]:size-3.5",
        size === "md" && "px-2.5 py-1 text-xs [&_svg]:size-4",
        size === "lg" && "px-4 py-1.5 text-base [&_svg]:size-5",
        meta.badge,
        className,
      )}
      data-status={status}
    >
      <Icon aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function NodeStatusBadge({ status, className }: { status: NodeStatus; className?: string }) {
  const meta = NODE_META[status];
  const Icon = NODE_ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide [&_svg]:size-3.5",
        meta.badge,
        className,
      )}
      title={meta.description}
      data-node-status={status}
    >
      <Icon aria-hidden="true" />
      <span>
        <span className="sr-only">Node </span>
        {meta.label}
      </span>
    </span>
  );
}
