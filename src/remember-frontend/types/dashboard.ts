export type ProjectStatus = "ingesting" | "repairing" | "isolating" | "live" | "failed";

export type LogEntry = {
  ts: string;
  agent: "ingest" | "repair" | "isolate" | "share";
  message: string;
};

export type Project = {
  id: string;
  repoUrl: string;
  owner: string;
  name: string;
  language: string;
  thumbnailUrl?: string;
  thumbnailHue?: number;
  status: ProjectStatus;
  previewUrl?: string;
  logs: LogEntry[];
  createdAt: string;
};

export type RecommendedRepo = {
  id: string;
  owner: string;
  name: string;
  language: string;
  lastCommitYear: number;
  tags: string[];
  thumbnailHue: number;
  imageUrl: string;
};
