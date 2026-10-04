"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/tour/steps";
import { hasCompletedTour, useTour } from "@/lib/store/tour";
import { cn } from "@/lib/utils";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const GAP = 14;
const CARD_MAX_W = 380;
/** How long to wait for a step's target to render (data loads, page navigation) before centring the card. */
const TARGET_TIMEOUT_MS = 5000;

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Card position next to the highlighted element: below if it fits, else above,
 * else beside it, else pinned to the bottom-right corner (very tall targets).
 */
function placeCard(rect: Rect | null, card: { width: number; height: number }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_MAX_W, vw - 32);
  if (!rect) return { top: Math.max(16, (vh - card.height) / 2), left: (vw - width) / 2, width };
  const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), vw - width - 16);
  const below = rect.top + rect.height + PAD + GAP;
  if (below + card.height <= vh - 16) return { top: below, left, width };
  const above = rect.top - PAD - GAP - card.height;
  if (above >= 16) return { top: above, left, width };
  const sideTop = Math.min(Math.max(16, rect.top), vh - card.height - 16);
  const right = rect.left + rect.width + PAD + GAP;
  if (right + width <= vw - 16) return { top: sideTop, left: right, width };
  const leftSide = rect.left - PAD - GAP - width;
  if (leftSide >= 16) return { top: sideTop, left: leftSide, width };
  return { top: Math.max(16, vh - card.height - 16), left: vw - width - 16, width };
}

/**
 * First-visit guided tour. Walks through the overview, a site page and the
 * alerts page, highlighting each part with a spotlight and a short
 * explanation. Starts automatically on the first visit to the overview and
 * can be replayed from the header's Tour button.
 */
export function GuidedTour() {
  const { active, index, start, next, back, end } = useTour();
  const router = useRouter();
  const pathname = usePathname();
  const step = TOUR_STEPS[index];
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [resolved, setResolved] = useState(false);
  const [cardSize, setCardSize] = useState({ width: CARD_MAX_W, height: 220 });
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Auto-start once for first-time visitors landing on the overview.
  useEffect(() => {
    if (pathname !== "/" || hasCompletedTour()) return;
    const id = setTimeout(() => {
      if (!useTour.getState().active) start();
    }, 900);
    return () => clearTimeout(id);
    // Only on first mount: navigating back to "/" later should not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remember what had focus so it can be restored when the tour closes.
  useEffect(() => {
    if (active) restoreFocus.current = document.activeElement as HTMLElement | null;
    else restoreFocus.current?.focus?.();
  }, [active]);

  // Enter a step: run its setup, navigate if needed, then wait for the target to appear.
  useEffect(() => {
    if (!active || !step) return;
    setResolved(false);
    setRect(null);
    step.onEnter?.();
    if (pathname !== step.path) {
      router.push(step.path);
      return; // Re-runs when the pathname changes.
    }
    if (!step.target) {
      setResolved(true);
      return;
    }
    const target = step.target;
    const started = performance.now();
    let frame = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(target);
      if (el && el.getBoundingClientRect().height > 0) {
        // Small screens: bring the top of the element just under the header, leaving room for the card below.
        el.scrollIntoView({
          block: window.innerWidth < 640 ? "start" : "center",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
        setResolved(true);
        return;
      }
      if (performance.now() - started > TARGET_TIMEOUT_MS) {
        setResolved(true); // Show the explanation centred rather than getting stuck.
        return;
      }
      frame = requestAnimationFrame(find);
    };
    frame = requestAnimationFrame(find);
    return () => cancelAnimationFrame(frame);
  }, [active, step, pathname, router]);

  // Track the target's position every frame so the spotlight follows scrolling and resizing.
  useEffect(() => {
    if (!active || !resolved || !step?.target) return;
    const target = step.target;
    let frame = 0;
    const track = () => {
      const el = document.querySelector<HTMLElement>(target);
      const r = el?.getBoundingClientRect();
      const nextRect = r && r.height > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      setRect((prev) => (sameRect(prev, nextRect) ? prev : nextRect));
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
  }, [active, resolved, step]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const { offsetWidth, offsetHeight } = cardRef.current;
    setCardSize((s) => (s.width === offsetWidth && s.height === offsetHeight ? s : { width: offsetWidth, height: offsetHeight }));
  }, [active, resolved, index, rect?.width]);

  useEffect(() => {
    if (active && resolved) primaryRef.current?.focus({ preventScroll: true });
  }, [active, resolved, index]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        end();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Tab" && cardRef.current) {
        // Keep keyboard focus inside the tour card while it is open.
        const focusable = cardRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [back, end, next],
  );

  if (!mounted || !active || !step) return null;

  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;
  const spot = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  const pos = placeCard(rect, cardSize);
  const titleId = `tour-title-${step.id}`;

  return createPortal(
    <div className="fixed inset-0 z-[1000]" onKeyDown={onKeyDown}>
      {/* Click-catcher so the page underneath cannot be used mid-tour. */}
      <div
        className={cn("absolute inset-0", !spot && "bg-ocean-950/65 backdrop-blur-[1px]")}
        aria-hidden="true"
      />
      {spot && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl ring-4 ring-ocean-300 transition-all duration-300 ease-out"
          style={{ ...spot, boxShadow: "0 0 0 9999px rgb(10 38 57 / 0.65)" }}
        />
      )}
      {resolved && (
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-body`}
          className="absolute rounded-xl border border-ocean-200 bg-card p-5 text-card-foreground shadow-2xl transition-[top,left] duration-300 ease-out animate-in fade-in-0 zoom-in-95"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-full bg-ocean-50 px-2.5 py-0.5 text-xs font-semibold text-ocean-700">
              {isFirst ? "Quick tour" : `Step ${index} of ${TOUR_STEPS.length - 1}`}
            </span>
            <button
              type="button"
              onClick={end}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close tour"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <h2 id={titleId} className="text-lg font-bold leading-snug tracking-tight text-ocean-950">
            {step.title}
          </h2>
          <div id={`${titleId}-body`} className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>{step.body}</p>
            {step.points && (
              <ul className="space-y-1.5 pl-1">
                {step.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ocean-500" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="mt-4 h-1 overflow-hidden rounded-full bg-ocean-100"
            role="progressbar"
            aria-label="Tour progress"
            aria-valuemin={1}
            aria-valuemax={TOUR_STEPS.length}
            aria-valuenow={index + 1}
          >
            <div
              className="h-full rounded-full bg-ocean-600 transition-all duration-300"
              style={{ width: `${((index + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            {isFirst ? (
              <Button variant="ghost" size="sm" onClick={end}>
                Skip tour
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={back}>
                <ArrowLeft aria-hidden="true" />
                Back
              </Button>
            )}
            <Button ref={primaryRef} size="sm" onClick={next}>
              {isFirst ? "Start tour" : isLast ? "Finish" : "Next"}
              {isLast ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            </Button>
          </div>
          <p className="sr-only" aria-live="polite">
            {step.title}
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
