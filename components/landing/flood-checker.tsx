"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, CloudRain, Info, LocateFixed, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/status/status-badge";
import { useRainOutlook, useSiteOverviews } from "@/lib/hooks/queries";
import { SourceTag } from "@/components/weather/data-source-note";
import { EXPOSURE_FACTOR, EXPOSURE_LABEL, PLACES, searchPlaces, type Place } from "@/lib/constants/places";
import { geocodeAccra, toPlace } from "@/lib/geocode";
import {
  LIKELIHOOD_META,
  RAIN_PRESETS,
  describeRain,
  estimateFlood,
  likelihoodCurve,
  siteForLocation,
  type Likelihood,
  type LocationInput,
} from "@/lib/forecast";
import { formatDayHour, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
];

const QUICK_PICKS = ["alajo", "kaneshie", "adabraka", "osu"];

const LIKELIHOOD_ORDER: Likelihood[] = ["LOW", "MODERATE", "HIGH", "VERY_HIGH"];

const TONE_CLASSES = {
  NORMAL: { text: "text-status-normal", bg: "bg-status-normal", soft: "bg-status-normal-bg" },
  WATCH: { text: "text-status-watch", bg: "bg-status-watch", soft: "bg-status-watch-bg" },
  WARNING: { text: "text-status-warning", bg: "bg-status-warning", soft: "bg-status-warning-bg" },
} as const;

type Suggestion = { kind: "place"; place: Place } | { kind: "remote"; query: string };

function toLocation(place: Place): LocationInput {
  return {
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    exposureFactor: EXPOSURE_FACTOR[place.exposure],
    channelSiteId: place.channelSiteId,
  };
}

function minutesText(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Location search with local suggestions and a map-search fallback (ARIA combobox). */
function LocationSearch({ onSelect }: { onSelect: (place: Place) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const abortRef = useRef<AbortController | null>(null);

  const local = useMemo(() => searchPlaces(query), [query]);
  const suggestions: Suggestion[] = remote
    ? remote.map((place) => ({ kind: "place", place }))
    : [
        ...local.map((place): Suggestion => ({ kind: "place", place })),
        ...(query.trim().length >= 3 && local.length === 0 ? [{ kind: "remote", query: query.trim() } as const] : []),
      ];

  useEffect(() => () => abortRef.current?.abort(), []);

  const choose = (place: Place) => {
    onSelect(place);
    setQuery(place.name);
    setOpen(false);
    setRemote(null);
    setError(null);
  };

  const searchMap = async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setError(null);
    try {
      const results = await geocodeAccra(q, controller.signal);
      if (results.length === 0) {
        setError(`We couldn't find "${q}" in Greater Accra. Try a nearby neighbourhood.`);
        setRemote(null);
      } else {
        setRemote(results.map((r, i) => toPlace(r, `search-${i}`)));
        setOpen(true);
        setActive(0);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Location search is unavailable right now. Pick a neighbourhood from the list.");
    } finally {
      setSearching(false);
    }
  };

  const activate = (s: Suggestion | undefined) => {
    if (!s) return;
    if (s.kind === "place") choose(s.place);
    else void searchMap(s.query);
  };

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="mb-1.5 block text-sm font-semibold">
        Your area
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && suggestions[active] ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          placeholder="e.g. Kaneshie, Alajo, East Legon"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setRemote(null);
            setError(null);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              activate(suggestions[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Searching" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching places"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.kind === "place" ? s.place.id : "remote"}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => activate(s)}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-sm",
                i === active && "bg-lagoon-50 text-lagoon-900",
              )}
            >
              {s.kind === "place" ? (
                <>
                  <MapPin className="mt-0.5 size-4 shrink-0 text-lagoon-600" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{s.place.name}</span>
                    {!s.place.id.startsWith("search-") && (
                      <span className="block text-xs text-muted-foreground">{s.place.note}</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Search className="mt-0.5 size-4 shrink-0 text-lagoon-600" aria-hidden="true" />
                  <span>
                    Search the map for <span className="font-medium">&ldquo;{s.query}&rdquo;</span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-status-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function LikelihoodMeter({ likelihood }: { likelihood: Likelihood }) {
  const level = LIKELIHOOD_ORDER.indexOf(likelihood);
  const tone = TONE_CLASSES[LIKELIHOOD_META[likelihood].tone];
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {LIKELIHOOD_ORDER.map((l, i) => (
        <span key={l} className={cn("h-2 flex-1 rounded-full", i <= level ? tone.bg : "bg-muted")} />
      ))}
    </div>
  );
}

function Fact({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

/**
 * "How likely is my area to flood?" checker for the landing page. Pick an
 * area and a rain scenario; the estimate comes from the nearest AquaLert
 * channel's thresholds and catchment model (see lib/forecast.ts).
 */
export function FloodChecker() {
  const [place, setPlace] = useState<Place | null>(null);
  // "forecast" uses the real rain forecast for the place; "whatif" uses the person's own scenario.
  const [mode, setMode] = useState<"forecast" | "whatif">("forecast");
  const [customRain, setCustomRain] = useState(25);
  const [customDuration, setCustomDuration] = useState(60);
  const [fromLive, setFromLive] = useState(true);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const { data: overviews } = useSiteOverviews();

  const location = place ? toLocation(place) : null;
  const outlook = useRainOutlook(place ? { latitude: place.latitude, longitude: place.longitude } : null);
  const storm = outlook.data?.storm ?? null;
  const usingForecast = mode === "forecast" && !!outlook.data;
  // Hourly forecast totals are average intensities; short bursts inside the hour can be heavier.
  const rain = usingForecast ? (storm ? Math.round(storm.peakMmHr * 10) / 10 : 0) : customRain;
  const duration = usingForecast ? (storm ? Math.min(360, Math.max(60, storm.durationMin)) : 60) : customDuration;
  const setRain = (v: number) => {
    setMode("whatif");
    setCustomRain(v);
    if (mode === "forecast") setCustomDuration(duration);
  };
  const setDuration = (v: number) => {
    setMode("whatif");
    setCustomDuration(v);
    if (mode === "forecast") setCustomRain(Math.max(1, Math.round(rain)));
  };
  const rainText = (mmHr: number) => (mmHr < 0.5 ? "no significant rain" : `${formatNumber(mmHr, mmHr < 10 ? 1 : 0)} mm/hr of ${describeRain(mmHr)} rain`);
  const siteId = location ? siteForLocation(location).site.siteId : null;
  const live = overviews?.find((o) => o.site.siteId === siteId);
  const liveLevel = live && live.site.status !== "OFFLINE" ? live.latestReading?.waterLevelCm : undefined;
  const startLevelCm = fromLive ? liveLevel : undefined;

  const estimate = useMemo(
    () => (location ? estimateFlood(location, { rainMmHr: rain, durationMin: duration, startLevelCm }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place, rain, duration, startLevelCm],
  );
  const curve = useMemo(
    () => (location ? likelihoodCurve(location, duration, startLevelCm) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place, duration, startLevelCm],
  );

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser can't share its location. Type your area instead.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPlace(toPlace({ name: "Your location", latitude: pos.coords.latitude, longitude: pos.coords.longitude }, "gps"));
      },
      () => {
        setLocating(false);
        setGeoError("We couldn't get your location. Type your area instead.");
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const meta = estimate ? LIKELIHOOD_META[estimate.likelihood] : null;
  const tone = meta ? TONE_CLASSES[meta.tone] : null;
  const farAway = estimate && estimate.distanceKm > 15;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Inputs */}
      <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div>
          <LocationSearch onSelect={setPlace} />
          <button
            type="button"
            onClick={useMyLocation}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-lagoon-700 hover:underline"
          >
            {locating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="size-4" aria-hidden="true" />}
            Use my location
          </button>
          {geoError && <p className="mt-1 text-sm text-status-warning">{geoError}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold" id="rain-source-label">Which rain?</p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="group" aria-labelledby="rain-source-label">
            {(
              [
                { value: "forecast", label: "Real forecast", icon: CloudRain },
                { value: "whatif", label: "What if…", icon: SlidersHorizontal },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  if (value === "whatif" && mode === "forecast") {
                    setCustomRain(Math.max(1, Math.round(rain)) || 25);
                    setCustomDuration(duration);
                  }
                  setMode(value);
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium",
                  mode === value ? "bg-background text-lagoon-800 shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {mode === "forecast"
              ? !place
                ? "Uses the next 48 hours of rain forecast for your area once you pick it."
                : outlook.isPending
                  ? "Getting the rain forecast for your area…"
                  : outlook.isError
                    ? "The rain forecast is unavailable right now, so this shows your own scenario instead."
                    : storm
                      ? `Heaviest rain forecast: about ${formatNumber(storm.peakMmHr, 1)} mm/hr around ${formatDayHour(storm.peakTime)} GMT${storm.probability !== null ? ` (${storm.probability}% chance)` : ""}.`
                      : "No significant rain is forecast for the next 48 hours."
              : "Choose any rain to see what it would do."}
          </p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">How hard is it raining?</legend>
          <div className="flex flex-wrap gap-2">
            {RAIN_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                title={p.description}
                aria-pressed={rain === p.mmHr}
                onClick={() => setRain(p.mmHr)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  rain === p.mmHr ? "border-lagoon-600 bg-lagoon-600 text-white" : "hover:border-lagoon-300 hover:bg-lagoon-50",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label htmlFor="rain-intensity" className="mt-4 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Rain intensity</span>
            <span className="font-semibold">
              {formatNumber(rain, rain < 10 ? 1 : 0)} mm/hr{" "}
              <span className="font-normal text-muted-foreground">· {rain < 0.5 ? "none" : describeRain(rain)}</span>
            </span>
          </label>
          <input
            id="rain-intensity"
            type="range"
            min={1}
            max={120}
            step={1}
            value={Math.max(1, Math.round(rain))}
            onChange={(e) => setRain(Number(e.target.value))}
            aria-valuetext={`${rain} millimetres per hour, ${describeRain(rain)} rain`}
            className="mt-2 w-full accent-lagoon-600"
          />
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">For how long?</legend>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                type="button"
                aria-pressed={duration === d.minutes}
                onClick={() => setDuration(d.minutes)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm font-medium",
                  duration === d.minutes ? "bg-background text-lagoon-800 shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Starting from</legend>
          <div className="space-y-2 text-sm">
            <label className="flex cursor-pointer items-start gap-2">
              <input type="radio" name="start" checked={fromLive} onChange={() => setFromLive(true)} className="mt-1 accent-lagoon-600" />
              <span>
                Today&rsquo;s conditions
                <span className="block text-xs text-muted-foreground">
                  {liveLevel !== undefined
                    ? `Uses the live water level (${formatNumber(liveLevel)} cm) from the nearest sensor.`
                    : "Uses the live water level when the nearest sensor is reporting."}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input type="radio" name="start" checked={!fromLive} onChange={() => setFromLive(false)} className="mt-1 accent-lagoon-600" />
              <span>
                Dry ground
                <span className="block text-xs text-muted-foreground">Channels at their normal dry-weather level.</span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      {/* Result */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6" aria-live="polite">
        {!estimate || !meta || !tone ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-lagoon-50 text-lagoon-600">
              <MapPin className="size-7" aria-hidden="true" />
            </span>
            <h3 className="text-xl font-bold">Choose an area to see its flood risk</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Type your neighbourhood, or try one of these:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK_PICKS.map((id) => {
                const p = PLACES.find((x) => x.id === id)!;
                return (
                  <Button key={id} variant="outline" size="sm" onClick={() => setPlace(p)}>
                    {p.name}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">
                {usingForecast ? (
                  <span className="inline-flex flex-wrap items-center gap-x-2">
                    <SourceTag kind="live" />
                    {storm
                      ? `Forecast: ${rainText(rain)} for about ${minutesText(duration)} on ${formatDayHour(storm.peakTime)} in`
                      : "Forecast: no significant rain in the next 48 hours in"}
                  </span>
                ) : (
                  `What if: ${rainText(rain)} for ${minutesText(duration)} in`
                )}
              </p>
              <h3 className="text-2xl font-bold" data-testid="checker-place">
                {place?.name}
              </h3>
            </div>

            <div className={cn("rounded-xl p-4", tone.soft)}>
              <p className="text-sm font-medium text-muted-foreground">Chance of flooding</p>
              <p className={cn("font-display text-4xl font-extrabold tracking-tight", tone.text)} data-testid="checker-likelihood">
                {meta.label}
              </p>
              <div className="mt-3">
                <LikelihoodMeter likelihood={estimate.likelihood} />
              </div>
              <p className="mt-3 font-medium">{meta.summary}</p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact
                label={`${estimate.site.siteName} channel would reach`}
                value={<RiskBadge status={estimate.status} size="sm" />}
                hint={`Peak ${formatNumber(estimate.peakLevelCm)} cm, danger line ${estimate.thresholds.waterWarningThresholdCm} cm`}
              />
              <Fact
                label="Danger line reached"
                value={estimate.minutesToDanger === null ? "Not reached" : estimate.minutesToDanger === 0 ? "Already above it" : `After about ${minutesText(estimate.minutesToDanger)}`}
              />
              <Fact
                label="Tipping point"
                value={estimate.tippingPointMmHr === null ? "Above 150 mm/hr" : `${estimate.tippingPointMmHr} mm/hr`}
                hint={`Rain at which flooding becomes more likely than not over ${minutesText(duration)}`}
              />
              <Fact label="Area exposure" value={EXPOSURE_LABEL[place!.exposure]} hint={place!.note} />
            </dl>

            <div>
              <p className="mb-2 text-sm font-semibold">Chance of flooding at other intensities ({minutesText(duration)})</p>
              <div className="flex h-28 items-end gap-1.5" role="img" aria-label={curve.map((c) => `${c.rainMmHr} mm/hr: ${LIKELIHOOD_META[c.likelihood].label}`).join(", ")}>
                {curve.map((c) => {
                  const near = Math.abs(c.rainMmHr - rain) === Math.min(...curve.map((x) => Math.abs(x.rainMmHr - rain)));
                  return (
                    <div key={c.rainMmHr} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className={cn("w-full rounded-t", TONE_CLASSES[LIKELIHOOD_META[c.likelihood].tone].bg, !near && "opacity-60")}
                        style={{ height: `${Math.max(4, c.probability * 100)}%` }}
                      />
                      <span className={cn("text-[11px] tabular-nums", near ? "font-bold text-foreground" : "text-muted-foreground")}>
                        {c.rainMmHr}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">Rain intensity (mm/hr)</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">What to do</p>
              <ul className="space-y-1.5 text-sm">
                {meta.advice.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", tone.bg)} aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            {live && (
              <Link
                href={`/sites/${live.site.siteId}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted/60"
              >
                <span>
                  <span className="block text-xs text-muted-foreground">Right now at the {live.site.siteName} sensor (simulated)</span>
                  <span className="font-semibold">
                    {live.site.status === "OFFLINE" ? "Sensor offline" : live.latestReading ? `Water ${formatNumber(live.latestReading.waterLevelCm)} cm` : "No data yet"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <RiskBadge status={live.riskStatus} size="sm" />
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
              </Link>
            )}

            <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Estimate based on the {estimate.site.siteName} sensor, {formatNumber(estimate.distanceKm, 1)} km away (
                {estimate.confidence.toLowerCase()} confidence
                {farAway ? "; your location is outside our sensor network, so treat this as a rough guide" : ""}). It uses the
                channel&rsquo;s alert thresholds and a simple rainfall model. The rain forecast is real (Open-Meteo weather
                models, hourly averages, so short bursts can be heavier); the channel levels are simulated until AquaLert
                sensors are installed. It is not an official flood forecast: blocked drains, tides and rain upstream can make
                things worse. Follow NADMO and Ghana Meteorological Agency advice.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
