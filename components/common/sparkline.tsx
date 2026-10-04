import { memo } from "react";

interface SparklineProps {
  values: number[];
  /** Horizontal reference lines (e.g. thresholds) drawn behind the line. */
  references?: { value: number; color: string }[];
  color: string;
  label: string;
  className?: string;
}

/** Lightweight SVG trend line; far cheaper than a full chart for site cards. */
export const Sparkline = memo(function Sparkline({ values, references = [], color, label, className }: SparklineProps) {
  const w = 240;
  const h = 48;
  if (values.length < 2) return <div className={className} aria-hidden="true" />;
  const max = Math.max(...values, ...references.map((r) => r.value)) * 1.05;
  const min = 0;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} role="img" aria-label={label}>
      {references.map((r) => (
        <line key={r.value} x1={0} x2={w} y1={y(r.value)} y2={y(r.value)} stroke={r.color} strokeDasharray="4 3" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.7} />
      ))}
      <path d={`${d}L${w},${h}L0,${h}Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
});
