import type { RepairAction, RepairStrategy } from "@/lib/contracts/repair";
import type { Invasiveness } from "@/lib/contracts/run";

export const INVASIVENESS_RANK: Readonly<Record<Invasiveness, number>> = {
  environment: 0,
  config: 1,
  dependency: 2,
  source: 3,
};

const ENVIRONMENT_FILES = new Set([".nvmrc", ".node-version", ".python-version", ".tool-versions"]);
const DEPENDENCY_FILES = new Set([
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
  "requirements.txt", "pyproject.toml", "Pipfile", "poetry.lock",
]);
const CONFIG_PATTERN = /(?:^|\/)(?:Dockerfile|Procfile|vercel\.json|.*\.config\.[^/]+|.*\.ya?ml|.*\.toml)$/;
const DEPENDENCY_COMMAND = /^(?:npm|pnpm|yarn|bun|pip3?|poetry)\s+(?:install|add|remove|update|sync)\b/;
const ENVIRONMENT_COMMAND = /^(?:nvm|fnm|mise|pyenv)\s+(?:install|use|shell|local)\b/;

export const normalizeStrategyInvasiveness = (strategy: RepairStrategy): RepairStrategy => {
  const invasiveness = effectiveInvasiveness(strategy);
  return { ...strategy, invasiveness };
};

export const effectiveInvasiveness = (strategy: RepairStrategy): Invasiveness => {
  const derived = deriveInvasiveness(strategy.actions);
  return INVASIVENESS_RANK[derived] > INVASIVENESS_RANK[strategy.invasiveness]
    ? derived
    : strategy.invasiveness;
};

const deriveInvasiveness = (actions: RepairAction[]): Invasiveness => {
  let result: Invasiveness = "environment";
  for (const action of actions) {
    const candidate = actionInvasiveness(action);
    if (INVASIVENESS_RANK[candidate] > INVASIVENESS_RANK[result]) result = candidate;
  }
  return result;
};

const actionInvasiveness = (action: RepairAction): Invasiveness => {
  if (action.type === "try_start") return "environment";
  if (action.type === "run_command") return commandInvasiveness(action.command);
  return pathInvasiveness(action.path);
};

const commandInvasiveness = (command: string): Invasiveness => {
  const normalized = command.trim();
  if (ENVIRONMENT_COMMAND.test(normalized)) return "environment";
  if (DEPENDENCY_COMMAND.test(normalized)) return "dependency";
  return "source";
};

const pathInvasiveness = (path: string): Invasiveness => {
  const name = path.replaceAll("\\", "/").split("/").at(-1) ?? path;
  if (ENVIRONMENT_FILES.has(name)) return "environment";
  if (DEPENDENCY_FILES.has(name)) return "dependency";
  return CONFIG_PATTERN.test(path) ? "config" : "source";
};
