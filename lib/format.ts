const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});
const timeOnly = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});
const dayTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Accra observes GMT all year, so UTC is also local time. */
export function formatDateTime(iso: string): string {
  return `${dateTime.format(new Date(iso))} UTC`;
}

export function formatTime(iso: string | number): string {
  return timeOnly.format(new Date(iso));
}

/** Axis label: time for short ranges, weekday + time for multi-day ranges. */
export function formatAxisTime(ms: number, multiDay: boolean): string {
  return multiDay ? dayTime.format(new Date(ms)) : timeOnly.format(new Date(ms));
}

export function formatRelative(iso: string, nowMs: number): string {
  const diffMin = Math.round((nowMs - Date.parse(iso)) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} h ${diffMin % 60} min ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Signed rise rate, e.g. "+1.24" / "-0.40". */
export function formatRise(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}`;
}

export function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
