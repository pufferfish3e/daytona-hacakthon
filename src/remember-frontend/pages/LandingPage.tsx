import { Navigation } from "../components/Navigation";
import { HeroSection } from "../sections/HeroSection";
import { ProblemSection } from "../sections/ProblemSection";
import { PipelineSection } from "../sections/PipelineSection";
import { UseCasesSection } from "../sections/UseCasesSection";
import { ComparisonSection } from "../sections/ComparisonSection";
import { StatsBarSection } from "../sections/StatsBarSection";
import { CtaSection } from "../sections/CtaSection";
import { Footer } from "../sections/Footer";

export function LandingPage() {
  return (
    <div className="bg-[#0a0a0a] text-white">
      <Navigation overHero />
      <HeroSection />
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
