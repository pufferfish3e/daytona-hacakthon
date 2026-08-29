const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9._-]+$/;

export interface ParsedRepository {
  owner: string;
  repo: string;
  canonicalUrl: string;
}

export class InvalidRepositoryUrlError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidRepositoryUrlError";
  }
}

export function parsePublicGitHubUrl(repoUrl: string): ParsedRepository {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    throw new InvalidRepositoryUrlError("Use a public HTTPS GitHub URL.");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const owner = parts[0];
  const repo = parts[1]?.replace(/\.git$/, "");
  if (url.protocol !== "https:" || url.hostname !== "github.com") throw new InvalidRepositoryUrlError("Use a public HTTPS GitHub URL.");
  if (url.username || url.password || url.search || url.hash || parts.length !== 2) throw new InvalidRepositoryUrlError("Repository URL contains unsupported parts.");
  if (!owner || !repo || !OWNER_PATTERN.test(owner) || !REPOSITORY_PATTERN.test(repo)) throw new InvalidRepositoryUrlError("Repository owner or name is invalid.");
  return { owner, repo, canonicalUrl: `https://github.com/${owner}/${repo}.git` };
}
