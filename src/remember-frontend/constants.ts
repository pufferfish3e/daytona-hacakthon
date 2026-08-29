import { GitBranch, Box, Link2, Share2 } from "lucide-react";

export const PRODUCT_NAME = "Remember";

export const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4";

export const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Early access", href: "#early-access" },
] as const;

export const PIPELINE_STEPS = [
  {
    num: "01",
    key: "ingesting" as const,
    icon: GitBranch,
    title: "Ingest",
    body: "Clone repo, map dependencies, scan runtime requirements.",
  },
  {
    num: "02",
    key: "repairing" as const,
    icon: Link2,
    title: "Repair",
    body: "Patch locks, stub services, quarantine secrets.",
  },
  {
    num: "03",
    key: "isolating" as const,
    icon: Box,
    title: "Isolate",
    body: "Build in an ephemeral sandbox — scoped and auditable.",
  },
  {
    num: "04",
    key: "live" as const,
    icon: Share2,
    title: "Share",
    body: "Publish an interactive preview anyone can click through.",
  },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  ingesting: "Ingesting",
  repairing: "Repairing",
  isolating: "Isolating",
  live: "Live",
  failed: "Failed",
};
