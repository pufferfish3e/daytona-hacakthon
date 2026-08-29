import { SectionLabel } from "../components/SectionLabel";
import { Building2, History, Scale } from "lucide-react";

const USE_CASES = [
  {
    icon: History,
    title: "Design historians",
    body: "Preserve what software felt like — not just how it looked in a PNG. Let researchers click through the real UI again.",
    tag: "Museums & archives",
  },
  {
    icon: Scale,
    title: "M&A diligence",
    body: "Evaluate acquired codebases by experiencing them, not reading stale docs. Rebuild in isolation before you integrate.",
    tag: "Acquirers & investors",
  },
  {
    icon: Building2,
    title: "Open-source maintainers",
    body: "Revive abandoned forks and deprecated versions so contributors can see what they're inheriting — and decide if it's worth saving.",
    tag: "OSS & foundations",
  },
] as const;

export function UseCasesSection() {
  return (
    <section id="use-cases" className="glass-section px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div data-animate="section">
          <SectionLabel>Use cases</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
            For anyone tired of explaining a product through screenshots
          </h2>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {USE_CASES.map((item) => (
            <article
              key={item.title}
              data-animate="card"
              className="archive-plate flex flex-col p-6 transition-colors"
            >
              <item.icon className="mb-6 h-5 w-5 text-white/50" />
              <p
                className="mb-3 text-xs font-medium text-white/40"
                style={{ fontFamily: "Geist Mono, ui-monospace, monospace" }}
              >
                {item.tag}
              </p>
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/50">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
