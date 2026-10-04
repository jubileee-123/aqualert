import type { AlertStatus, NodeStatus } from "@/types";

/** Display metadata for each risk level. Every status is shown with both colour and text. */
export const RISK_META: Record<
  AlertStatus,
  { label: string; description: string; badge: string; solid: string; text: string; hex: string; rank: number }
> = {
  NORMAL: {
    label: "Normal",
    description: "Water level, rainfall and rise rate are below thresholds.",
    badge: "bg-status-normal-bg text-status-normal border-status-normal/30",
    solid: "bg-status-normal text-white",
    text: "text-status-normal",
    hex: "#15803d",
    rank: 0,
  },
  WATCH: {
    label: "Watch",
    description: "Water is rising or heavy rain is sustained. Stay alert and prepare.",
    badge: "bg-status-watch-bg text-status-watch border-status-watch/30",
    solid: "bg-status-watch text-white",
    text: "text-status-watch",
    hex: "#b45309",
    rank: 1,
  },
  WARNING: {
    label: "Warning",
    description: "Water is above the danger line and rising fast. Act now.",
    badge: "bg-status-warning-bg text-status-warning border-status-warning/30",
    solid: "bg-status-warning text-white",
    text: "text-status-warning",
    hex: "#b91c1c",
    rank: 2,
  },
};

export const NODE_META: Record<NodeStatus, { label: string; description: string; badge: string }> = {
  ONLINE: {
    label: "Online",
    description: "Reporting on schedule.",
    badge: "bg-white text-status-normal border-status-normal/40",
  },
  STALE: {
    label: "Stale",
    description: "No reading for over 15 minutes. Values shown may be out of date.",
    badge: "bg-status-offline-bg text-status-offline border-status-offline/40",
  },
  OFFLINE: {
    label: "Offline",
    description: "No reading for over an hour. Check power and connectivity.",
    badge: "bg-status-offline text-white border-transparent",
  },
};

export const OFFLINE_HEX = "#64748b";
