import { LandingHeader } from "@/components/landing/landing-header";
import {
  AudienceSection,
  CheckerSection,
  CtaSection,
  FaqSection,
  GuideSection,
  Hero,
  HowSection,
  LandingFooter,
} from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main id="main" tabIndex={-1} className="flex-1">
        <Hero />
        <CheckerSection />
        <HowSection />
        <AudienceSection />
        <GuideSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
