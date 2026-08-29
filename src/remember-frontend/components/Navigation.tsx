import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { CtaButton } from "./CtaButton";
import { NAV_LINKS, PRODUCT_NAME } from "../constants";

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col glass-panel-strong rounded-none border-y-0 border-r-0 transition-transform duration-500 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-white">
            <Logo className="fill-white" />
            <span className="text-lg font-semibold">{PRODUCT_NAME}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col px-6 pt-4">
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-1 border-b border-white/10 py-4 text-base font-medium text-white/80 transition-all duration-300 hover:text-white ${
                open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${index * 60}ms` : "0ms" }}
            >
              {link.label}
              {link.label === "Pipeline" && <ChevronDown className="h-3.5 w-3.5" />}
            </a>
          ))}
        </nav>

        <div
          className={`px-6 pb-8 transition-all duration-300 ${
            open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: open ? "300ms" : "0ms" }}
        >
          <CtaButton to="/create" className="w-full py-3" />
        </div>
      </div>
    </>
  );
}

type NavigationProps = {
  overHero?: boolean;
};

export function Navigation({ overHero = false }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const showLightNav = overHero && !scrolled;
  const logoClass = showLightNav ? "fill-[#010101] lg:fill-white" : "fill-white";
  const wordmarkClass = showLightNav
    ? "text-[#010101] lg:text-white"
    : "text-white";
  const iconClass = showLightNav
    ? "text-[#010101] lg:text-white"
    : "text-white";

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 transition-colors duration-300 sm:px-8 sm:py-6 lg:px-12 ${
          scrolled || !overHero ? "glass-header" : "bg-transparent"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <Logo className={logoClass} />
          <span className={`text-lg font-semibold ${wordmarkClass}`}>{PRODUCT_NAME}</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div className="glass-nav flex items-center px-1.5 py-1.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
                {link.label === "Pipeline" && <ChevronDown className="h-3.5 w-3.5" />}
              </a>
            ))}
          </div>
          <CtaButton to="/create" className="self-stretch px-5" />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-lg md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <Menu
            className={`absolute h-5 w-5 transition-all duration-300 ${iconClass} ${
              menuOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <X
            className={`absolute h-5 w-5 transition-all duration-300 ${iconClass} ${
              menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </button>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
