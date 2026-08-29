import { SectionLabel } from "../components/SectionLabel";

const STATS = [
  { value: "73%", label: "of archived repos have broken dependency chains" },
  { value: "0", label: "interactive experiences in a screenshot folder" },
  { value: "100%", label: "reproducible sandbox rebuilds with full audit trail" },
] as const;

export function ProblemSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-white/10 bg-[#0a0a0a] px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-end">
          <div>
            <SectionLabel>The gap</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              Archives preserve memory.
              <br />
              They kill <span className="italic text-white/60">experience</span>.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60">
              Wayback Machine captures pixels. README files rot. Dependencies break. The thing that
              made software valuable — the feel of using it — vanishes behind a 404.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="border-l border-white/15 pl-6 transition-colors hover:border-white/40"
              >
                <p className="name-stat-number text-4xl tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
