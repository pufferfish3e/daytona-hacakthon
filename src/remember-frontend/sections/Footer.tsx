import { Logo } from "../components/Logo";
import { PRODUCT_NAME } from "../constants";

const FOOTER_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Early access", href: "#early-access" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="fill-white" />
            <span className="text-lg font-semibold text-white">{PRODUCT_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/40">
            Software deserves to be felt — not just filed away.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/30">&copy; 2026 {PRODUCT_NAME}. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-xs text-white/30 transition-colors hover:text-white/60">
            Privacy
          </a>
          <a href="#" className="text-xs text-white/30 transition-colors hover:text-white/60">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
