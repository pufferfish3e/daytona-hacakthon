import type { ComputeProvider, SandboxFile, SandboxRef } from "@/lib/compute/provider";
import { resolveRepositoryPath } from "@/lib/daytona/path-policy";
import { withDeadline } from "./deadline";
import { EVIDENCE_FILE_LIMIT_BYTES, EVIDENCE_TOTAL_LIMIT_BYTES } from "./limits";

export const HIGH_VALUE_FILES = [
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
  "requirements.txt", "pyproject.toml", "Pipfile", "poetry.lock", "Dockerfile",
  "docker-compose.yml", "compose.yml", "README.md", "README", ".nvmrc",
  ".node-version", ".python-version", ".tool-versions", "vercel.json", "Procfile",
  ".env.example", ".env.sample",
] as const;

export interface RepoEvidence {
  rootFiles: string[];
  textFiles: Record<string, string>;
  commit: string;
}

export interface CollectEvidenceInput {
  provider: ComputeProvider;
  sandbox: SandboxRef;
  repoRoot: string;
  commit: string;
  deadline: number;
  now: () => number;
}

const HIGH_VALUE_SET = new Set<string>(HIGH_VALUE_FILES);
const encoder = new TextEncoder();

export async function collectRepoEvidence(input: CollectEvidenceInput): Promise<RepoEvidence> {
  const files = await withDeadline(input.deadline, input.now, "repository file listing", () =>
    input.provider.listFiles(input.sandbox, input.repoRoot, 2));
  const rootFiles = normalizeRootFiles(files, input.repoRoot);
  const candidates = selectCandidates(files, input.repoRoot);
  const textFiles = await readCandidates(input, candidates);
  return { commit: input.commit, rootFiles, textFiles };
}

const readCandidates = async (input: CollectEvidenceInput, files: SandboxFile[]): Promise<Record<string, string>> => {
  const collected: Record<string, string> = {};
  let totalBytes = 0;
  for (const file of files) {
    const relative = relativeRootPath(file.path, input.repoRoot);
    if (totalBytes >= EVIDENCE_TOTAL_LIMIT_BYTES) break;
    const content = await withDeadline(input.deadline, input.now, `evidence read ${relative}`, () =>
      input.provider.readTextFile(input.sandbox, resolveRepositoryPath(input.repoRoot, relative)));
    const bounded = truncateUtf8(content, Math.min(EVIDENCE_FILE_LIMIT_BYTES, EVIDENCE_TOTAL_LIMIT_BYTES - totalBytes));
    collected[relative] = bounded;
    totalBytes += encoder.encode(bounded).byteLength;
  }
  return collected;
};

const selectCandidates = (files: SandboxFile[], repoRoot: string): SandboxFile[] =>
  files.filter((file: SandboxFile): boolean => {
    const relative = relativeRootPath(file.path, repoRoot);
    return !file.isDirectory && !relative.includes("/") && HIGH_VALUE_SET.has(relative) &&
      file.sizeBytes !== undefined && file.sizeBytes <= EVIDENCE_FILE_LIMIT_BYTES;
  }).sort((left: SandboxFile, right: SandboxFile): number => left.path.localeCompare(right.path));

const normalizeRootFiles = (files: SandboxFile[], repoRoot: string): string[] =>
  [...new Set(files.filter((file: SandboxFile): boolean => !file.isDirectory)
    .map((file: SandboxFile): string => relativeRootPath(file.path, repoRoot)))]
    .filter((path: string): boolean => !path.includes("/"))
    .sort((left: string, right: string): number => left.localeCompare(right));

const relativeRootPath = (path: string, repoRoot: string): string => {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
  const root = repoRoot.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/$/, "");
  return normalized.startsWith(`${root}/`) ? normalized.slice(root.length + 1) : normalized;
};

const truncateUtf8 = (content: string, byteLimit: number): string => {
  if (encoder.encode(content).byteLength <= byteLimit) return content;
  let end = Math.min(content.length, byteLimit);
  while (end > 0 && encoder.encode(content.slice(0, end)).byteLength > byteLimit) end -= 1;
  return content.slice(0, end);
};
