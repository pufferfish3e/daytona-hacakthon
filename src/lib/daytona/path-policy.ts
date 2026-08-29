export class UnsafeSandboxPathError extends Error {
  public constructor(path: string) {
    super(`Sandbox path is not repository-relative: ${path}`);
    this.name = "UnsafeSandboxPathError";
  }
}

const DRIVE_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

export function resolveRepositoryPath(repoRoot: string, relativePath: string): string {
  assertSafePath(repoRoot);
  assertSafePath(relativePath);
  const root = normalizeSegments(repoRoot).join("/");
  const relative = normalizeSegments(relativePath).join("/");
  return `${root}/${relative}`;
}

const assertSafePath = (path: string): void => {
  if (path.length === 0 || path.includes("\u0000") || path.startsWith("/") || DRIVE_PATH_PATTERN.test(path)) {
    throw new UnsafeSandboxPathError(path);
  }
  const segments = path.replaceAll("\\", "/").split("/");
  if (segments.some((segment: string) => segment === "..") || segments.every(isEmptySegment)) {
    throw new UnsafeSandboxPathError(path);
  }
};

const normalizeSegments = (path: string): string[] =>
  path.replaceAll("\\", "/").split("/").filter((segment: string) => segment !== "" && segment !== ".");

const isEmptySegment = (segment: string): boolean => segment === "" || segment === ".";
