import { Copy, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { CtaButton } from "../CtaButton";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function LivePreviewPanel({
  owner,
  name,
  previewUrl,
}: {
  owner: string;
  name: string;
  previewUrl: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-medium text-emerald-400/90">Resurrection complete</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Live prototype</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                className={`rounded-md p-1.5 transition-colors ${
                  device === key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
                aria-label={`${key} preview`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(previewUrl)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <Copy className="h-3 w-3" />
            Copy link
          </button>
          <CtaButton
            label="Open sandbox"
            className="px-4 py-1.5 text-xs"
            onClick={() => window.open(previewUrl, "_blank")}
          />
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto bg-[#050505] p-4 sm:p-6">
        <div
          className="h-full min-h-[420px] overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-2xl transition-all duration-500"
          style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
        >
          {/* Mock revived app UI */}
          <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-black/60 px-3">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="ml-2 font-mono text-[10px] text-white/30">
              preview.remember.dev/{owner}/{name}
            </span>
          </div>

          <div className="flex h-[calc(100%-28px)] flex-col bg-[#0f0f0f]">
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">Acme Dashboard</span>
              <nav className="hidden gap-4 text-xs text-white/50 sm:flex">
                <span className="text-white">Overview</span>
                <span>Reports</span>
                <span>Settings</span>
              </nav>
            </header>

            <div className="flex-1 overflow-auto p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Active users", value: "1,284" },
                  { label: "Revenue", value: "$42.8k" },
                  { label: "Uptime", value: "99.2%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="text-[10px] text-white/40">{stat.label}</p>
                    <p className="name-stat-number mt-1 text-xl text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">Weekly activity</p>
                <div className="mt-4 flex h-24 items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-white/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {["User session restored", "API routes stubbed", "Build deployed"].map((line) => (
                  <div
                    key={line}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200/80"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-[#050505] px-5 py-3 sm:px-6">
        <p className="text-xs text-white/40">
          Revived from a dormant repo — interactive and shareable
        </p>
        <a
          href={`https://github.com/${owner}/${name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white/80"
        >
          View source
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
