import { SectionLabel } from "../components/SectionLabel";

const LOGOS = [
  "Archive Labs",
  "Meridian",
  "Stratify",
  "Internet Archive",
  "FoundationDB",
  "OSS Capital",
  "Retrocomputing",
  "Wayback",
] as const;

export function LogoStripSection() {
  return (
    <section
      data-animate="section"
      className="border-t border-white/10 bg-[#0a0a0a] px-5 py-12 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <SectionLabel className="text-center">
          Trusted by teams preserving software history
        </SectionLabel>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {LOGOS.map((name) => (
            <span
              key={name}
              data-animate="logo"
              className="text-sm font-semibold tracking-tight text-white/40 transition-colors hover:text-white/60"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
