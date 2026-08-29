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
import { SandboxProvisioningPanel } from "../components/project/SandboxProvisioningPanel";
import { ResurrectionSummary } from "../components/project/ResurrectionSummary";
import { useProjects } from "../context/ProjectsContext";
import { COMPLETE_MOCK_MANIFEST } from "../data/completeMock";
import { getProjectDetail } from "../data/projectDetail";
import { isHeroDemoProject, isFakeRunPacingEnabled, isRealResurrectionRun } from "../lib/demo-presentation";
import { LOCAL_MOCK_PREVIEW_URL, previewUrlForProject, isBonkyEmbedPreviewUrl } from "../lib/preview-url";
import { projectStatusLabel } from "../lib/run-orchestration";
import { useRunPresentationPhase } from "../hooks/useRunPresentationPhase";
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
  const presentationPhase = useRunPresentationPhase(activeProject, activeRun);
  const isHero = isHeroDemoProject(activeProject);
  const showOrchestration = Boolean(activeProject && !isHero && presentationPhase === "orchestration");
  const showRepairRace = Boolean(
    activeProject && !isHero && presentationPhase === "repair" && activeProject.status !== "failed",
  );
  const isDemoLivePhase =
    isFakeRunPacingEnabled() &&
    !isHero &&
    !isRealResurrectionRun(activeProject) &&
    presentationPhase === "live";

  const showLive = Boolean(
    activeProject &&
      activeProject.status !== "failed" &&
      (isHero || activeProject.status === "live" || isDemoLivePhase),
  );

  useEffect(() => {
    if (!projectId && projects[0]) {
      navigate(`/create/generated/${projects[0].id}`, { replace: true });
    }
  }, [projectId, projects, navigate]);

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

  if (activeProject.status === "failed") {
    return (
      <div
        ref={rootRef}
        className="mesh-bg flex h-screen flex-col overflow-hidden text-archive-ink"
      >
        <ProjectSessionHeader
          sessionId={detail.sessionId}
          statusLabel="Resurrection failed"
          statusTone="idle"
          projectLabel={`${activeProject.owner}/${activeProject.name}`}
          showPause={false}
        />
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="text-lg font-medium text-red-300">Could not resurrect this project</p>
          <p className="mt-2 max-w-md text-sm text-archive-muted">
            {activeRun?.failureReason ?? "The repair race did not produce a working preview."}
          </p>
          <Link
            to="/create"
            className="archive-cta mt-8 rounded-full px-6 py-2.5 text-sm font-medium"
          >
            Try another repository
          </Link>
        </div>
      </div>
    );
  }

  if (showLive) {
    const manifest = isHeroDemoProject(activeProject)
      ? COMPLETE_MOCK_MANIFEST
      : manifestFromProject(detail);
    const resolvedPreviewUrl = previewUrlForProject(
      activeProject.previewUrl ?? LOCAL_MOCK_PREVIEW_URL,
    );

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
          <aside className="order-2 hidden w-72 shrink-0 flex-col border-r border-archive-border/80 bg-black/20 backdrop-blur-md lg:order-none lg:flex xl:w-80">
            <RepoSubmittedPanel project={activeProject} detail={detail} />
            <EventTimeline events={detail.timeline} />
          </aside>
          <section className="order-1 min-h-0 min-w-0 flex-1 lg:order-none">
            <LivePreviewPanel
              owner={activeProject.owner}
              name={activeProject.name}
              previewUrl={resolvedPreviewUrl}
              sessionId={detail.sessionId}
              runInlineBonky={isHero || isBonkyEmbedPreviewUrl(resolvedPreviewUrl)}
            />
          </section>
          <aside className="order-3 hidden w-72 shrink-0 flex-col border-l border-archive-border/80 bg-black/20 backdrop-blur-md xl:order-none xl:flex">
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

  if (showRepairRace) {
    return (
      <div
        ref={rootRef}
        className="mesh-bg flex h-screen flex-col overflow-hidden text-archive-ink"
      >
        <ProjectSessionHeader
          sessionId={detail.sessionId}
          statusLabel="Resurrecting"
          statusTone="progress"
          projectLabel={`${activeProject.owner}/${activeProject.name}`}
        />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside
            data-animate="project-col"
            data-side="left"
            className="order-2 flex w-full shrink-0 flex-col border-b border-archive-border/80 bg-black/20 backdrop-blur-md lg:order-none lg:w-72 lg:border-b-0 lg:border-r xl:w-80"
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
              isEvaluating
            />
          </section>

          <aside data-animate="project-col" data-side="right" className="hidden" aria-hidden>
            <SafetyContextPanel checks={detail.safetyChecks} />
            <ProjectProfilePanel profile={detail.profile} />
          </aside>
        </div>
      </div>
    );
  }

  if (showOrchestration) {
    return (
      <div
        ref={rootRef}
        className="mesh-bg flex h-screen flex-col overflow-hidden text-archive-ink"
      >
        <ProjectSessionHeader
          sessionId={detail.sessionId}
          statusLabel={projectStatusLabel(activeProject.status, activeRun)}
          statusTone="progress"
          projectLabel={`${activeProject.owner}/${activeProject.name}`}
          showPause={false}
        />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="order-2 flex w-full shrink-0 flex-col border-b border-archive-border lg:order-none lg:w-72 lg:border-b-0 lg:border-r xl:w-80">
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
          <section className="relative order-1 min-h-0 min-w-0 flex-1 lg:order-none">
            <SandboxProvisioningPanel
              owner={activeProject.owner}
              name={activeProject.name}
              active
              run={activeRun}
            />
          </section>
        </div>
      </div>
    );
  }

  return null;
}
