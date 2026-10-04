"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { CircleHelp, RefreshCw } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/hooks/queries";
import { useTour } from "@/lib/store/tour";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About" },
];

/** Latest successful fetch time across all cached queries. */
function useLastUpdated(): number | null {
  const client = useQueryClient();
  const [last, setLast] = useState<number | null>(null);
  useEffect(() => {
    const cache = client.getQueryCache();
    const compute = () => {
      const max = Math.max(0, ...cache.getAll().map((q) => q.state.dataUpdatedAt));
      setLast(max > 0 ? max : null);
    };
    compute();
    return cache.subscribe(compute);
  }, [client]);
  return last;
}

export function AppHeader() {
  const pathname = usePathname();
  const client = useQueryClient();
  const fetching = useIsFetching({ queryKey: queryKeys.all }) > 0;
  const lastUpdated = useLastUpdated();
  const startTour = useTour((s) => s.start);

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/sites") : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-ocean-950 bg-gradient-to-r from-ocean-950 via-ocean-900 to-ocean-800 text-white shadow-sm">
      <div className="container flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:ring-offset-ocean-950">
          <Logo className="h-8 w-8" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-xl font-bold tracking-tight">AquaLert</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-ocean-200">Accra flood early warning</span>
          </span>
        </Link>

        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  data-tour={`nav-${item.label.toLowerCase()}`}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "inline-block rounded-md px-3 py-2 text-sm font-medium text-ocean-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-offset-ocean-950",
                    isActive(item.href) && "bg-white/15 text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-ocean-100 hover:bg-white/10 hover:text-white focus-visible:ring-offset-ocean-950"
            onClick={startTour}
            aria-label="Take a guided tour of the dashboard"
          >
            <CircleHelp aria-hidden="true" />
            <span className="hidden sm:inline">Tour</span>
          </Button>
          <div data-tour="refresh" className="flex items-center gap-3">
          <p className="text-right text-xs leading-tight text-ocean-100" aria-live="polite">
            <span className="block text-[10px] uppercase tracking-wider text-ocean-300">Last updated</span>
            <span className="font-semibold tabular-nums text-white">
              {lastUpdated ? `${formatTime(lastUpdated)} GMT` : "--:--"}
            </span>
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20 focus-visible:ring-offset-ocean-950"
            onClick={() => client.invalidateQueries({ queryKey: queryKeys.all })}
            disabled={fetching}
          >
            <RefreshCw className={cn(fetching && "animate-spin")} aria-hidden="true" />
            <span>{fetching ? "Refreshing" : "Refresh"}</span>
          </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
