import { OFFLINE_HEX, RISK_META } from "@/lib/status";

export function MapLegend() {
  const items = [
    { label: "Normal", color: RISK_META.NORMAL.hex },
    { label: "Watch", color: RISK_META.WATCH.hex },
    { label: "Warning", color: RISK_META.WARNING.hex },
    { label: "Stale / offline", color: OFFLINE_HEX },
  ];
  return (
    <ul aria-label="Map legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-white shadow" style={{ background: i.color }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
