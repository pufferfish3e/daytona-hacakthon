import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ProjectSessionHeader } from "../components/project/ProjectSessionHeader";
import { RepoSubmittedPanel } from "../components/project/RepoSubmittedPanel";
import { EventTimeline } from "../components/project/EventTimeline";
import { RepairRacePanel } from "../components/project/RepairRacePanel";
import { SafetyContextPanel } from "../components/project/SafetyContextPanel";
import { ProjectProfilePanel } from "../components/project/ProjectProfilePanel";
import { LivePreviewPanel } from "../components/project/LivePreviewPanel";
import { ResurrectionSummary } from "../components/project/ResurrectionSummary";
import { useProjects } from "../context/ProjectsContext";
import { getProjectDetail } from "../data/projectDetail";
import { previewUrlForProject } from "../lib/preview-url";
import { WorkspaceIframeGuard } from "../components/WorkspaceIframeGuard";
import { useProjectPageAnimations } from "../hooks/useProjectPageAnimations";
import type { ResurrectionManifest } from "../types/projectDetail";

function manifestFromProject(
  detail: ReturnType<typeof getProjectDetail>,
): ResurrectionManifest {
  const winner = detail.repairLanes.find((l) => l.status === "passed") ?? detail.repairLanes[0];
  return {
    framework: detail.profile[0]?.name ?? "Unknown",
    runtime: detail.profile.find((p) => p.name === "Node.js")?.version ?? "Unknown",
    packageManager: detail.profile.find((p) => p.name === "npm")?.version ?? "npm",
    installCommand: "npm ci",
    startCommand: "npm run dev",
    port: 3000,
    repairAttempts: 2,
    environmentAdjustments: winner?.invasiveness === "environment" ? 1 : 0,
    sourceFilesModified: winner?.invasiveness === "source" ? 1 : 0,
    changedFiles: winner?.changedFiles ?? [],
    winnerLane: winner?.laneLetter ?? "A",
    winnerTitle: winner?.title ?? "Historical Node runtime",
  };
}

export function GeneratedWorkspacePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, getProject, getRun } = useProjects();

  const activeProject = projectId ? getProject(projectId) : projects[0];
  const activeRun = activeProject ? getRun(activeProject.id) : undefined;
  const detail = useMemo(
    () => (activeProject ? getProjectDetail(activeProject, activeRun) : null),
    [activeProject, activeRun],
  );

  const rootRef = useProjectPageAnimations(activeProject?.id);

  useEffect(() => {
    if (!projectId && projects[0]) {
      navigate(`/create/generated/${projects[0].id}`, { replace: true });
    }
  }, [projectId, projects, navigate]);

  const isResurrecting =
    activeProject &&
    ["repairing", "isolating", "ingesting"].includes(activeProject.status);

  if (!activeProject || !detail) {
    return (
      <div className="mesh-bg flex min-h-screen flex-col text-archive-ink">
        <ProjectSessionHeader
          sessionId="PR-000000"
          statusLabel="Awaiting submission"
          statusTone="idle"
          projectLabel=""
          showPause={false}
        />
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="text-lg font-medium">No project selected</p>
          <p className="mt-2 max-w-sm text-sm text-archive-muted">
            Paste a dormant GitHub URL to start a resurrection.
          </p>
          <Link
            to="/create"
            className="archive-cta mt-8 rounded-full px-6 py-2.5 text-sm font-medium"
          >
            Resurrect project
          </Link>
        </div>
      </div>
    );
  }

  if (activeProject.status === "live") {
    const manifest = manifestFromProject(detail);

    return (
      <WorkspaceIframeGuard>
      <div
        ref={rootRef}
        className="mesh-bg flex h-screen flex-col overflow-hidden text-archive-ink"
      >
        <ProjectSessionHeader
          sessionId={detail.sessionId}
          statusLabel="Project resurrected"
          statusTone="success"
          projectLabel={`${activeProject.owner}/${activeProject.name}`}
          showPause={false}
        />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="order-2 hidden w-72 shrink-0 flex-col border-r border-archive-border lg:order-none lg:flex xl:w-80">
            <RepoSubmittedPanel project={activeProject} detail={detail} />
            <EventTimeline events={detail.timeline} />
          </aside>
          <section className="order-1 min-h-0 min-w-0 flex-1 lg:order-none">
            <LivePreviewPanel
              owner={activeProject.owner}
              name={activeProject.name}
              previewUrl={previewUrlForProject(activeProject.previewUrl)}
            />
          </section>
          <aside className="order-3 hidden w-72 shrink-0 flex-col border-l border-archive-border xl:order-none xl:flex">
            <SafetyContextPanel checks={detail.safetyChecks} />
            <ProjectProfilePanel profile={detail.profile} />
            <ResurrectionSummary
              manifest={manifest}
              owner={activeProject.owner}
              name={activeProject.name}
            />
          </aside>
        </div>
      </div>
      </WorkspaceIframeGuard>
    );
  }

  return (
    <div
      ref={rootRef}
      className="mesh-bg flex h-screen flex-col overflow-hidden text-archive-ink"
    >
      <ProjectSessionHeader
        sessionId={detail.sessionId}
        statusLabel={isResurrecting ? "Resurrecting" : "Processing"}
        statusTone={isResurrecting ? "progress" : "idle"}
        projectLabel={`${activeProject.owner}/${activeProject.name}`}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          data-animate="project-col"
          data-side="left"
          className="order-2 flex w-full shrink-0 flex-col border-b border-archive-border lg:order-none lg:w-72 lg:border-b-0 lg:border-r xl:w-80"
        >
          <Link
            to="/create/generated"
            className="flex items-center gap-1.5 border-b border-archive-border px-4 py-2.5 text-xs text-archive-muted transition-colors hover:text-archive-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All projects
          </Link>
          <RepoSubmittedPanel project={activeProject} detail={detail} />
          <EventTimeline events={detail.timeline} />
        </aside>

        <section
          data-animate="project-col"
          data-side="center"
          className="order-1 min-h-0 min-w-0 flex-1 border-b border-archive-border lg:order-none lg:min-h-0 lg:border-b-0"
        >
          <RepairRacePanel
            snapshotHash={detail.snapshotHash}
            lanes={detail.repairLanes}
            elapsedSeconds={detail.elapsedSeconds}
            estimatedSeconds={detail.estimatedSeconds}
            isEvaluating={activeProject.status === "repairing"}
          />
        </section>

        {/* Analytics hidden during in-progress — only repair race stage is visible */}
        <aside
          data-animate="project-col"
          data-side="right"
          className="hidden"
          aria-hidden
        >
          <SafetyContextPanel checks={detail.safetyChecks} />
          <ProjectProfilePanel profile={detail.profile} />
        </aside>
      </div>
    </div>
  );
}
