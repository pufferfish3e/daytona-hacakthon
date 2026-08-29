import type { ProjectProfile } from "@/lib/contracts/run";
import type { RepoEvidence } from "./inspect";

interface PackageManifest {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines: Record<string, string>;
  packageManager?: string;
  scripts: Record<string, string>;
}

const EMPTY_MANIFEST: PackageManifest = { dependencies: {}, devDependencies: {}, engines: {}, scripts: {} };

export function detectProject(evidence: RepoEvidence): ProjectProfile {
  if (evidence.textFiles["package.json"] !== undefined) return detectNode(evidence);
  if (hasPythonEvidence(evidence)) return detectPython(evidence);
  return unsupportedProfile();
}

const detectNode = (evidence: RepoEvidence): ProjectProfile => {
  const manifest = parseManifest(evidence.textFiles["package.json"] ?? "");
  const dependencies = { ...manifest.devDependencies, ...manifest.dependencies };
  const framework = nodeFramework(dependencies);
  const packageManager = nodePackageManager(evidence, manifest.packageManager);
  const startScript = manifest.scripts.dev !== undefined ? "dev" : manifest.scripts.start !== undefined ? "start" : undefined;
  const language = dependencies.typescript !== undefined || evidence.rootFiles.includes("tsconfig.json") ? "typescript" : "javascript";
  return {
    evidence: nodeEvidence(manifest, framework, startScript), framework,
    installCommand: nodeInstallCommand(packageManager), isGui: framework !== "Express" && framework !== "Node.js",
    language, likelyPorts: framework === "Vite" ? [5173] : [3000], packageManager,
    runtime: manifest.engines.node === undefined ? undefined : `Node ${manifest.engines.node}`,
    startCommand: startScript === undefined ? undefined : `npm run ${startScript}`.replace("npm", packageManager),
  };
};

const detectPython = (evidence: RepoEvidence): ProjectProfile => {
  const combined = Object.values(evidence.textFiles).join("\n").toLowerCase();
  const framework = pythonFramework(combined);
  const packageManager = evidence.rootFiles.includes("poetry.lock") ? "poetry" : "pip";
  return {
    evidence: [`Detected ${framework} from bounded Python dependency evidence.`], framework,
    installCommand: pythonInstallCommand(evidence, packageManager), isGui: framework === "Streamlit" || framework === "Gradio",
    language: "python", likelyPorts: pythonPorts(framework), packageManager,
    runtime: pythonRuntime(evidence), startCommand: pythonStartCommand(evidence, framework),
  };
};

const parseManifest = (content: string): PackageManifest => {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed)) return EMPTY_MANIFEST;
    return {
      dependencies: stringRecord(parsed.dependencies), devDependencies: stringRecord(parsed.devDependencies),
      engines: stringRecord(parsed.engines), packageManager: optionalString(parsed.packageManager),
      scripts: stringRecord(parsed.scripts),
    };
  } catch (_error: unknown) { return EMPTY_MANIFEST; }
};

const nodeFramework = (dependencies: Record<string, string>): string => {
  if (dependencies.next !== undefined) return "Next.js";
  if (dependencies.vite !== undefined) return "Vite";
  if (dependencies.vue !== undefined) return "Vue";
  if (dependencies.react !== undefined) return "React";
  if (dependencies.express !== undefined) return "Express";
  return "Node.js";
};

const nodePackageManager = (evidence: RepoEvidence, declared?: string): ProjectProfile["packageManager"] => {
  if (evidence.rootFiles.includes("pnpm-lock.yaml")) return "pnpm";
  if (evidence.rootFiles.includes("yarn.lock")) return "yarn";
  if (evidence.rootFiles.includes("bun.lockb")) return "bun";
  if (evidence.rootFiles.includes("package-lock.json")) return "npm";
  const name = declared?.split("@")[0];
  return name === "pnpm" || name === "yarn" || name === "bun" || name === "npm" ? name : "npm";
};

const nodeInstallCommand = (manager: ProjectProfile["packageManager"]): string => {
  if (manager === "pnpm") return "pnpm install --frozen-lockfile";
  if (manager === "yarn") return "yarn install --frozen-lockfile";
  if (manager === "bun") return "bun install --frozen-lockfile";
  return "npm ci";
};

const nodeEvidence = (manifest: PackageManifest, framework: string, script?: string): string[] => {
  const items = [`package.json dependencies indicate ${framework}.`];
  if (script !== undefined) items.push(`package.json scripts.${script}=${manifest.scripts[script]}`);
  if (manifest.engines.node !== undefined) items.push(`package.json engines.node=${manifest.engines.node}`);
  return items;
};

const hasPythonEvidence = (evidence: RepoEvidence): boolean =>
  ["requirements.txt", "pyproject.toml", "Pipfile", "poetry.lock"].some((name: string) => evidence.rootFiles.includes(name));

const pythonFramework = (content: string): string => {
  if (content.includes("streamlit")) return "Streamlit";
  if (content.includes("gradio")) return "Gradio";
  if (content.includes("fastapi")) return "FastAPI";
  if (content.includes("django")) return "Django";
  if (content.includes("flask")) return "Flask";
  return "Python";
};

const pythonInstallCommand = (evidence: RepoEvidence, manager: "pip" | "poetry"): string | undefined => {
  if (manager === "poetry") return "poetry install";
  return evidence.rootFiles.includes("requirements.txt") ? "pip3 install -r requirements.txt" : undefined;
};

const pythonStartCommand = (evidence: RepoEvidence, framework: string): string | undefined => {
  const procfile = evidence.textFiles.Procfile?.split("\n").find((line: string) => line.startsWith("web:"));
  if (procfile !== undefined) return procfile.slice(4).trim() || undefined;
  const readme = evidence.textFiles["README.md"] ?? evidence.textFiles.README ?? "";
  const documented = readme.match(/(?:^|\n)(?:\$\s*)?(uvicorn\s+[\w.:-]+[^\n]*|flask\s+run[^\n]*|streamlit\s+run\s+[^\n]+)/i)?.[1];
  if (documented !== undefined) return documented.trim();
  if (!evidence.rootFiles.includes("app.py")) return undefined;
  if (framework === "Streamlit") return "streamlit run app.py";
  return framework === "Flask" || framework === "Gradio" ? "python3 app.py" : undefined;
};

const pythonPorts = (framework: string): number[] => {
  if (framework === "Streamlit") return [8501];
  if (framework === "Gradio") return [7860];
  if (framework === "Flask") return [5000];
  return [8000];
};

const pythonRuntime = (evidence: RepoEvidence): string | undefined => {
  const version = evidence.textFiles[".python-version"]?.trim();
  return version === undefined || version === "" ? undefined : `Python ${version}`;
};

const unsupportedProfile = (): ProjectProfile => ({
  evidence: ["No supported Node or Python project manifest was found."], framework: "Unknown",
  isGui: false, language: "unknown", likelyPorts: [], packageManager: "unknown",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalString = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;

const stringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry: [string, unknown]): entry is [string, string] => typeof entry[1] === "string"));
};
