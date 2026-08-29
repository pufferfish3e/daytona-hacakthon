import type { LogEntry, Project, RecommendedRepo } from "../types/dashboard";

export const RECOMMENDED_REPOS: RecommendedRepo[] = [
  {
    id: "rec-1",
    owner: "mozilla",
    name: "persona",
    language: "JavaScript",
    lastCommitYear: 2016,
    tags: ["archived", "auth"],
    thumbnailHue: 28,
    imageUrl:
      "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "rec-2",
    owner: "facebookarchive",
    name: "origami",
    language: "Objective-C",
    lastCommitYear: 2019,
    tags: ["design tools", "ios"],
    thumbnailHue: 210,
    imageUrl:
      "https://images.pexels.com/photos/39284/macbook-apple-imac-computer-39284.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "rec-3",
    owner: "googlearchive",
    name: "code",
    language: "Go",
    lastCommitYear: 2018,
    tags: ["devtools", "archived"],
    thumbnailHue: 145,
    imageUrl:
      "https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "rec-4",
    owner: "dropbox",
    name: "zxcvbn",
    language: "JavaScript",
    lastCommitYear: 2017,
    tags: ["security", "passwords"],
    thumbnailHue: 320,
    imageUrl:
      "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "rec-5",
    owner: "airbnb",
    name: "lottie-web",
    language: "TypeScript",
    lastCommitYear: 2020,
    tags: ["animation", "oss"],
    thumbnailHue: 12,
    imageUrl:
      "https://images.pexels.com/photos/147288/pexels-photo-147288.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "rec-6",
    owner: "stripe",
    name: "jquery.payment",
    language: "JavaScript",
    lastCommitYear: 2015,
    tags: ["payments", "legacy"],
    thumbnailHue: 265,
    imageUrl:
      "https://images.pexels.com/photos/50987/money-card-business-credit-card-50987.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const MOCK_LOG_TEMPLATES: Record<string, LogEntry[]> = {
  ingesting: [
    { ts: "00:01", agent: "ingest", message: "Cloning https://github.com/{owner}/{name}.git" },
    { ts: "00:03", agent: "ingest", message: "Mapping dependency tree (package.json, lockfiles)" },
    { ts: "00:05", agent: "ingest", message: "Detected runtime: Node 18, npm workspaces" },
    { ts: "00:07", agent: "ingest", message: "Scanning for secrets and env references" },
  ],
  repairing: [
    { ts: "00:12", agent: "repair", message: "Pinning compatible dependency versions" },
    { ts: "00:15", agent: "repair", message: "Patching broken lockfile (npm ci failed)" },
    { ts: "00:18", agent: "repair", message: "Stubbing missing API endpoints with fixtures" },
    { ts: "00:22", agent: "repair", message: "Replacing deprecated build tooling" },
  ],
  isolating: [
    { ts: "00:28", agent: "isolate", message: "Provisioning ephemeral sandbox" },
    { ts: "00:31", agent: "isolate", message: "Network scope: outbound blocked, internal only" },
    { ts: "00:34", agent: "isolate", message: "Running build inside sandbox" },
    { ts: "00:38", agent: "isolate", message: "Health check passed on port 3000" },
  ],
  live: [
    { ts: "00:42", agent: "share", message: "Publishing preview URL" },
    { ts: "00:43", agent: "share", message: "Prototype is live — share link ready" },
  ],
};

export function buildInitialLogs(owner: string, name: string): LogEntry[] {
  return MOCK_LOG_TEMPLATES.ingesting.map((entry) => ({
    ...entry,
    message: entry.message.replace("{owner}", owner).replace("{name}", name),
  }));
}

export function logsForStatus(
  status: Project["status"],
  owner: string,
  name: string,
): LogEntry[] {
  const order: Project["status"][] = ["ingesting", "repairing", "isolating", "live"];
  const idx = order.indexOf(status);
  if (idx === -1) return buildInitialLogs(owner, name);

  const logs: LogEntry[] = [];
  for (let i = 0; i <= idx; i++) {
    const key = order[i];
    const template = MOCK_LOG_TEMPLATES[key];
    logs.push(
      ...template.map((entry) => ({
        ...entry,
        message: entry.message.replace("{owner}", owner).replace("{name}", name),
      })),
    );
  }
  return logs;
}

export function createProjectFromUrl(
  repoUrl: string,
  owner: string,
  name: string,
  language = "Unknown",
  thumbnailHue?: number,
): Project {
  const id = `proj-${Date.now()}`;
  return {
    id,
    repoUrl,
    owner,
    name,
    language,
    thumbnailHue,
    status: "ingesting",
    logs: buildInitialLogs(owner, name),
    createdAt: new Date().toISOString(),
  };
}

export function parseGitHubUrl(input: string): { owner: string; name: string; url: string } | null {
  const trimmed = input.trim();
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const owner = match[1];
      const name = match[2].replace(/\.git$/, "");
      return { owner, name, url: `https://github.com/${owner}/${name}` };
    }
  }
  return null;
}

export const DEMO_PROJECTS: Project[] = [
  {
    id: "demo-1",
    repoUrl: "https://github.com/mozilla/persona",
    owner: "mozilla",
    name: "persona",
    language: "JavaScript",
    thumbnailHue: 28,
    status: "repairing",
    logs: logsForStatus("repairing", "mozilla", "persona"),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];
