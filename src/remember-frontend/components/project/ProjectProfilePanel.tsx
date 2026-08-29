import type { ProjectProfileItem } from "../../types/projectDetail";

const STACK_ICONS: Record<string, string> = {
  "Next.js": "▲",
  React: "◉",
  "Node.js": "⬡",
  npm: "◆",
};

export function ProjectProfilePanel({ profile }: { profile: ProjectProfileItem[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <p className="accession-label">Detected project profile</p>
      <ul className="mt-4 space-y-3">
        {profile.map((item) => (
          <li
            key={item.name}
            className="specimen-card flex items-center justify-between px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-archive-border bg-archive-bg-deep text-xs text-archive-muted">
                {STACK_ICONS[item.name] ?? "·"}
              </span>
              <span className="text-sm font-medium text-archive-ink">{item.name}</span>
            </div>
            <span className="font-mono text-xs text-archive-muted">{item.version}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
