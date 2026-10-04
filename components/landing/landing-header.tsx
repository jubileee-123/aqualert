"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#check", label: "Check your area" },
  { href: "#how", label: "How it works" },
  { href: "#guide", label: "Flood guide" },
  { href: "#faq", label: "FAQ" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled || open ? "bg-ocean-950/95 shadow-lg backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center gap-6 text-white">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:ring-offset-ocean-950">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">AquaLert</span>
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-ocean-100 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="bg-white text-ocean-900 hover:bg-ocean-50">
            <Link href="/dashboard">Live dashboard</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 md:hidden"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="landing-mobile-nav" aria-label="Main" className="border-t border-white/10 md:hidden">
          <ul className="container flex flex-col py-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium text-ocean-50 hover:bg-white/10"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
