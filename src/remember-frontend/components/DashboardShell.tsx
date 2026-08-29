import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { CtaButton } from "./CtaButton";
import { PRODUCT_NAME } from "../constants";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const onGenerated = location.pathname.startsWith("/create/generated");

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/70 px-5 py-4 backdrop-blur-xl sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="fill-white" />
          <span className="text-lg font-semibold text-white">{PRODUCT_NAME}</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/create"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !onGenerated
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Discover
          </Link>
          <Link
            to="/create/generated"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              onGenerated
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Workspace
          </Link>
          <CtaButton to="/create" label="Create project" className="hidden sm:inline-flex" />
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
