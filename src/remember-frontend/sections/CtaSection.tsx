import { GetStartedButton } from "../components/GetStartedButton";
import { SectionLabel } from "../components/SectionLabel";

export function CtaSection() {
  return (
    <section
      id="early-access"
      className="border-t border-white/10 bg-[#0a0a0a] px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div className="mx-auto max-w-3xl text-center">
        <SectionLabel className="text-center">Early access</SectionLabel>
        <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
          Your archive has a pulse.
          <br />
          Let&apos;s find it.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/60">
          Tell us about a dormant project. We&apos;ll reconstruct it in isolation and send you a
          link to experience it — for real.
        </p>

        <div className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5">
          <input
            type="email"
            placeholder="Your repo URL or email"
            className="w-full rounded-full bg-white px-5 py-3 text-sm text-[#010101] placeholder:text-[#010101]/40 outline-none sm:flex-1 sm:bg-transparent sm:py-2"
          />
          <GetStartedButton className="w-full sm:w-auto sm:self-stretch sm:px-6" label="Request access" />
        </div>

        <p className="mt-6 text-xs text-white/30">
          No credit card. We&apos;ll reach out within 48 hours.
        </p>
      </div>
    </section>
  );
}
