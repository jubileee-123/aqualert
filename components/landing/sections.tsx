import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CircleCheck,
  CloudRain,
  FlaskConical,
  Gauge,
  House,
  Footprints,
  OctagonAlert,
  Radio,
  School,
  ShieldCheck,
  TriangleAlert,
  Users,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { LiveStatusCard } from "@/components/landing/live-status-card";
import { FloodChecker } from "@/components/landing/flood-checker";
import { RAIN_PRESETS } from "@/lib/forecast";
import { cn } from "@/lib/utils";

function SectionHeading({ eyebrow, title, intro, light }: { eyebrow: string; title: string; intro?: string; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className={cn("text-sm font-semibold uppercase tracking-widest", light ? "text-ocean-300" : "text-ocean-600")}>{eyebrow}</p>
      <h2 className={cn("mt-2 text-3xl font-bold tracking-tight sm:text-4xl", light && "text-white")}>{title}</h2>
      {intro && <p className={cn("mt-4 text-lg", light ? "text-ocean-100" : "text-muted-foreground")}>{intro}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-700 pb-24 pt-28 text-white sm:pt-32">
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-background"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          fillOpacity="0.25"
          d="M0 64c120 22 240 33 360 22S600 40 720 40s240 35 360 46 240-4 360-26v60H0z"
        />
        <path fill="currentColor" d="M0 88c160 18 320 22 480 8s320-46 480-40 320 34 480 30v34H0z" />
      </svg>
      <div className="container relative grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-ocean-100">
            <Waves className="size-4" aria-hidden="true" />
            Community flood early warning for Accra
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Know before the water rises.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ocean-100 sm:text-xl">
            AquaLert sensors watch Accra&rsquo;s drains and rivers around the clock and warn communities by SMS and
            WhatsApp before floods reach their homes. Check how your area could be affected the next time it rains.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-ocean-900 hover:bg-ocean-50">
              <a href="#check">
                Check your area <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/dashboard">See live sensors</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {[
              ["6", "monitoring sites"],
              ["5 min", "between readings"],
              ["3", "alert levels"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-bold">{v}</dd>
                <dd className="text-sm text-ocean-200">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <LiveStatusCard />
      </div>
    </section>
  );
}

export function CheckerSection() {
  return (
    <section id="check" className="scroll-mt-20 py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Flood risk checker"
          title="How likely is your area to flood?"
          intro="Type your neighbourhood and choose how hard it is raining. We'll estimate the chance of flooding from the nearest AquaLert sensor and its alert thresholds."
        />
        <FloodChecker />
      </div>
    </section>
  );
}

const AUDIENCE = [
  { icon: House, title: "Residents", body: "Get a warning on your phone while there is still time to protect your family and belongings." },
  { icon: Users, title: "Community leaders", body: "See which areas are at risk and help neighbours move to safety early." },
  { icon: ShieldCheck, title: "NADMO and assemblies", body: "Watch every drain at once and send help where water is rising fastest." },
  { icon: School, title: "Schools and markets", body: "Decide when to send people home before roads flood." },
  { icon: FlaskConical, title: "Researchers", body: "Use the rainfall and water-level record to plan better drainage." },
];

export function AudienceSection() {
  return (
    <section className="bg-ocean-50/60 py-20">
      <div className="container">
        <SectionHeading eyebrow="Who it's for" title="Built for the people who need to act first" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {AUDIENCE.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-xl border bg-card p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-lg bg-ocean-100 text-ocean-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Radio, title: "Sense", body: "Solar-powered sensors on key drains measure the water level and rainfall every 5 minutes." },
  { icon: Gauge, title: "Analyse", body: "Each reading is checked against that site's watch and danger lines and how fast the water is rising." },
  { icon: BellRing, title: "Alert", body: "When a site reaches Watch or Warning, people nearby get an SMS and WhatsApp message straight away." },
  { icon: Footprints, title: "Act", body: "Families move valuables up and leave early, and responders know exactly where to go." },
];

export function HowSection() {
  return (
    <section id="how" className="scroll-mt-20 py-20">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title="From raindrop to warning in minutes"
          intro="Flash floods in Accra can rise within an hour. AquaLert turns live sensor readings into clear warnings people can act on."
        />
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative rounded-xl border bg-card p-6 shadow-sm">
              <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-ocean-100" aria-hidden="true">
                {i + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-full bg-ocean-600 text-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const LEVELS = [
  {
    icon: CircleCheck,
    name: "Normal",
    tone: "border-status-normal/30 bg-status-normal-bg text-status-normal",
    when: "Water and rain are below the watch levels.",
    actions: ["Keep drains in front of your home clear of rubbish.", "Save emergency numbers: 112 and your assembly."],
  },
  {
    icon: TriangleAlert,
    name: "Watch",
    tone: "border-status-watch/30 bg-status-watch-bg text-status-watch",
    when: "Water is rising or heavy rain has lasted 15 minutes.",
    actions: ["Raise valuables, documents and electrical items.", "Keep children away from drains.", "Be ready to move."],
  },
  {
    icon: OctagonAlert,
    name: "Warning",
    tone: "border-status-warning/30 bg-status-warning-bg text-status-warning",
    when: "Water is above the danger line and rising fast.",
    actions: ["Move to higher ground now.", "Switch off electricity at the mains.", "Never walk or drive through flood water."],
  },
];

export function GuideSection() {
  return (
    <section id="guide" className="scroll-mt-20 bg-ocean-950 py-20 text-white">
      <div className="container">
        <SectionHeading
          light
          eyebrow="Flood guide"
          title="What each alert means and what to do"
          intro="Every AquaLert message carries one of three levels. The colour, icon and word always match."
        />
        <ul className="grid gap-6 lg:grid-cols-3">
          {LEVELS.map(({ icon: Icon, name, tone, when, actions }) => (
            <li key={name} className="rounded-xl bg-white p-6 text-foreground shadow-lg">
              <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-wide", tone)}>
                <Icon className="size-4" aria-hidden="true" />
                {name}
              </span>
              <p className="mt-4 font-semibold">{when}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {actions.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ocean-500" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-xl border border-white/15 bg-white/5 p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <CloudRain className="size-5 text-ocean-300" aria-hidden="true" />
            How heavy is the rain?
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {RAIN_PRESETS.map((p) => (
              <li key={p.label} className="rounded-lg bg-white/5 p-3">
                <p className="font-semibold">{p.label}</p>
                <p className="font-display text-2xl font-bold text-ocean-200">{p.mmHr} mm/hr</p>
                <p className="mt-1 text-sm text-ocean-100">{p.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "How accurate is the flood risk checker?",
    a: "It is an estimate, not a forecast. It runs the nearest sensor's channel through a simple rainfall model and its alert thresholds, then adjusts for how low-lying your area is. Blocked drains, tides and rain upstream can make flooding worse than it shows. Always follow official NADMO and Ghana Meteorological Agency advice.",
  },
  {
    q: "How do I get alerts on my phone?",
    a: "Alerts go out by SMS and WhatsApp to people registered near each sensor. During this pilot, registration is through your community leader or assembly member.",
  },
  {
    q: "What if my area has no sensor?",
    a: "The checker uses the closest sensor and tells you how far away it is. The further away, the rougher the estimate. We are adding sensors to more drains as the network grows.",
  },
  {
    q: "What happens if a sensor stops working?",
    a: "The dashboard marks it Stale after 15 minutes without a reading and Offline after an hour, so nobody mistakes old data for live data. A field team is sent to fix it.",
  },
  {
    q: "Is the data on this site real?",
    a: "This prototype runs on realistic simulated data for six Accra sites so the system can be tested before the sensors go live.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <div className="container max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions people ask" />
        <div className="divide-y rounded-xl border bg-card">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-xl text-ocean-600 transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="pb-20">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-to-r from-ocean-800 to-ocean-600 p-8 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">See what the sensors see right now</h2>
            <p className="mt-2 text-ocean-100">Live water levels, rainfall and alerts for every AquaLert site in Accra.</p>
          </div>
          <Button asChild size="lg" className="bg-white text-ocean-900 hover:bg-ocean-50">
            <Link href="/dashboard">
              Open the dashboard <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t bg-ocean-950 py-10 text-ocean-100">
      <div className="container flex flex-col gap-6 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="font-display text-lg font-bold text-white">AquaLert</span>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/dashboard" className="hover:text-white hover:underline">Dashboard</Link></li>
            <li><Link href="/alerts" className="hover:text-white hover:underline">Alert history</Link></li>
            <li><Link href="/about" className="hover:text-white hover:underline">How alerts work</Link></li>
          </ul>
        </nav>
        <p>In an emergency call <strong className="text-white">112</strong>.</p>
      </div>
    </footer>
  );
}
