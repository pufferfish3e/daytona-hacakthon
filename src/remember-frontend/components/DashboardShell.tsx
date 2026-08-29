import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { PRODUCT_NAME } from "../constants";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const onGenerated = location.pathname.startsWith("/create/generated");

  return (
    <div className="mesh-bg flex min-h-screen flex-col text-archive-ink">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-archive-border bg-[#0a0a0a]/80 px-5 py-4 backdrop-blur-xl sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="fill-archive-ink" />
          <span className="text-lg font-semibold text-archive-ink">{PRODUCT_NAME}</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/create"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !onGenerated
                ? "bg-white/10 text-white"
                : "text-archive-muted hover:bg-white/10 hover:text-white"
            }`}
          >
            Discover
          </Link>
          <Link
            to="/create/generated"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              onGenerated
                ? "bg-white/10 text-white"
                : "text-archive-muted hover:bg-white/10 hover:text-white"
            }`}
          >
            Workspace
          </Link>
          <Link
            to="/create"
            className="archive-cta hidden rounded-full px-5 py-2 text-sm font-medium transition-opacity sm:inline-flex"
          >
            Resurrect project
          </Link>
        </div>
      </header>

      <main className="relative flex-1">{children}</main>
    </div>
  );
}
