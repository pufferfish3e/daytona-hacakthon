import { SectionLabel } from "../components/SectionLabel";
import { PRODUCT_NAME } from "../constants";

export function ComparisonSection() {
  return (
    <section className="border-t border-white/10 bg-[#0a0a0a] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div data-animate="section">
          <SectionLabel>Before & after</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
          Screenshots are evidence.
          <br />
          Prototypes are <span className="italic text-white/60">proof</span>.
          </h2>
        </div>

        <div data-animate="section" className="mt-14 grid overflow-hidden rounded-2xl border border-white/10 lg:grid-cols-2">
          <div data-animate="card" className="border-b border-white/10 bg-white/[0.02] p-8 lg:border-b-0 lg:border-r">
            <p
              className="mb-6 text-xs font-medium text-red-400/80"
              style={{ fontFamily: "Geist Mono, ui-monospace, monospace" }}
            >
              How we archive today
            </p>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#111]">
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"
                alt="Broken archive — static screenshot with expired link"
                className="h-full w-full object-cover opacity-40 grayscale"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p
                  className="text-sm font-medium text-red-400/90"
                  style={{ fontFamily: "Geist Mono, ui-monospace, monospace" }}
                >
                  404 — Link expired
                </p>
              </div>
              <div className="absolute left-0 right-0 top-0 flex h-7 items-center gap-1.5 border-b border-white/10 bg-black/60 px-3">
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/50">
              <li>Static PNG in a folder</li>
              <li>Dead CDN links</li>
              <li>Broken dependency tree</li>
            </ul>
          </div>

          <div data-animate="card" className="bg-white/[0.04] p-8">
            <p
              className="mb-6 text-xs font-medium text-emerald-400/80"
              style={{ fontFamily: "Geist Mono, ui-monospace, monospace" }}
            >
              What {PRODUCT_NAME} delivers
            </p>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-emerald-500/20 bg-[#111]">
              <img
                src="https://images.unsplash.com/photo-1461742480684-dccba630e2f6?w=800&q=80"
                alt="Live interactive prototype running in sandbox"
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute left-0 right-0 top-0 flex h-7 items-center gap-1.5 border-b border-emerald-500/20 bg-emerald-950/40 px-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="h-2 w-3/4 rounded bg-white/20" />
                <div className="h-2 w-1/2 rounded bg-white/10" />
                <div className="mt-3 h-6 w-24 rounded-full border border-emerald-500/30 bg-emerald-500/10" />
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/60">
              <li>Live sandbox rebuild</li>
              <li>Shareable preview link</li>
              <li>Full audit trail of patches</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
