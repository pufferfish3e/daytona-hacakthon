import type { ProjectProfileItem } from "../../types/projectDetail";

const STACK_ICONS: Record<string, string> = {
  "Next.js": "▲",
  "Node.js": "⬡",
  npm: "◆",
};

export function ProjectProfilePanel({ profile }: { profile: ProjectProfileItem[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <p className="text-[10px] font-medium text-white/40">
        Detected project profile
      </p>
      <ul className="mt-4 space-y-3">
        {profile.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-xs text-white/50">
                {STACK_ICONS[item.name] ?? "·"}
              </span>
              <span className="text-sm font-medium text-white">{item.name}</span>
            </div>
            <span className="font-mono text-xs text-white/50">{item.version}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-5 w-full rounded-lg border border-white/10 py-2 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
      >
        View full analysis
      </button>
    </div>
  );
}
