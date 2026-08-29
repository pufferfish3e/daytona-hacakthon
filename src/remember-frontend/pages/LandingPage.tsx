import { useLandingPageAnimations } from "../hooks/useLandingPageAnimations";
import { Navigation } from "../components/Navigation";
import { HeroSection } from "../sections/HeroSection";
import { LogoStripSection } from "../sections/LogoStripSection";
import { ProblemSection } from "../sections/ProblemSection";
import { PipelineSection } from "../sections/PipelineSection";
import { UseCasesSection } from "../sections/UseCasesSection";
import { ComparisonSection } from "../sections/ComparisonSection";
import { StatsBarSection } from "../sections/StatsBarSection";
import { CtaSection } from "../sections/CtaSection";
import { Footer } from "../sections/Footer";

export function LandingPage() {
  const rootRef = useLandingPageAnimations();

  return (
    <div ref={rootRef} className="mesh-bg text-white">
      <Navigation overHero />
      <HeroSection />
      <LogoStripSection />
      <ProblemSection />
      <ComparisonSection />
      <PipelineSection />
      <StatsBarSection />
      <UseCasesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
