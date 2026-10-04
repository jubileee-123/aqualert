export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="currentColor" className="text-ocean-400" />
      <path d="M16 5c-3.6 5-7 9-7 13a7 7 0 0 0 14 0c0-4-3.4-8-7-13z" fill="#fff" />
      <path
        d="M9.6 19.5c1.6 1 3 1 4.5 0s3-1 4.4 0 2.9 1 4.1 0"
        stroke="#0a2639"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
