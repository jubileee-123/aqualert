import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GuidedTour } from "@/components/tour/guided-tour";

// Self-hosted at build time by next/font: Inter for body text, Bricolage Grotesque for headings.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });

export const metadata: Metadata = {
  title: { default: "AquaLert | Know before the water rises", template: "%s | AquaLert" },
  description:
    "Check how likely your part of Accra is to flood when heavy rain comes, with live water levels and alerts from AquaLert community sensors.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#032a2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to main content
        </a>
        <Providers>
          {children}
          <GuidedTour />
        </Providers>
      </body>
    </html>
  );
}
