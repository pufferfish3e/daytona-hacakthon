import { SectionLabel } from "../components/SectionLabel";
import { ArrowRight, Box, GitBranch, Link2, Share2 } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: GitBranch,
    title: "Ingest",
    body: "Point at a Git URL, tarball, or archive snapshot. We map the dependency tree and runtime requirements.",
  },
  {
    num: "02",
    icon: Link2,
    title: "Repair",
    body: "Auto-patch broken locks, pin compatible versions, stub missing services, and quarantine secrets.",
  },
  {
    num: "03",
    icon: Box,
    title: "Isolate",
    body: "Build runs inside an ephemeral sandbox — network-scoped, time-boxed, fully auditable.",
  },
  {
    num: "04",
    icon: Share2,
    title: "Share",
    body: "Publish an interactive preview link. Anyone experiences the software, not a museum label.",
  },
] as const;

export function PipelineSection() {
  return (
    <section id="pipeline" className="border-t border-white/10 bg-[#0a0a0a] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div data-animate="section">
          <SectionLabel>Pipeline</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
            From dormant repo to living prototype
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
            Four stages. Fully automated where possible, human-reviewed where it matters.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article
              key={step.num}
              data-animate="card"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="name-stat-number text-sm text-white/30">{step.num}</span>
                <step.icon className="h-4 w-4 text-white/40 transition-colors group-hover:text-white/70" />
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{step.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#early-access"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            See a rebuild in action
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
