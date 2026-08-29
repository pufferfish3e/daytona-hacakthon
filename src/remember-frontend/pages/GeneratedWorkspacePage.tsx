import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { CtaButton } from "../components/CtaButton";
import { ProjectSessionHeader } from "../components/project/ProjectSessionHeader";
import { RepoSubmittedPanel } from "../components/project/RepoSubmittedPanel";
import { EventTimeline } from "../components/project/EventTimeline";
import { RepairRacePanel } from "../components/project/RepairRacePanel";
import { SafetyContextPanel } from "../components/project/SafetyContextPanel";
import { ProjectProfilePanel } from "../components/project/ProjectProfilePanel";
import { useProjects } from "../context/ProjectsContext";
import { getProjectDetail } from "../data/projectDetail";
import { useProjectPageAnimations } from "../hooks/useProjectPageAnimations";

export function GeneratedWorkspacePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, getProject, advanceProject } = useProjects();

  const activeProject = projectId ? getProject(projectId) : projects[0];
  const detail = useMemo(
    () => (activeProject ? getProjectDetail(activeProject) : null),
    [activeProject],
  );

  const rootRef = useProjectPageAnimations(activeProject?.id);

  useEffect(() => {
    if (!projectId && projects[0]) {
      navigate(`/create/generated/${projects[0].id}`, { replace: true });
    }
  }, [projectId, projects, navigate]);

  useEffect(() => {
    if (!activeProject || activeProject.status === "live" || activeProject.status === "failed") {
      return;
    }
    const timer = setInterval(() => advanceProject(activeProject.id), 5000);
    return () => clearInterval(timer);
  }, [activeProject?.id, activeProject?.status, advanceProject]);

  const isLiveRace =
    activeProject &&
    ["repairing", "isolating", "ingesting"].includes(activeProject.status);

  if (!activeProject || !detail) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
        <ProjectSessionHeader sessionId="PR-000000" isLive={false} projectLabel="" />
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="text-lg font-medium">No project selected</p>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Paste a repo URL on the discover page to start remembering a project.
          </p>
          <CtaButton to="/create" label="Discover repos" className="mt-8" />
        </div>
      </div>
    );
  }

  if (activeProject.status === "live") {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
        <ProjectSessionHeader
          sessionId={detail.sessionId}
          isLive={false}
          projectLabel={`${activeProject.owner}/${activeProject.name}`}
        />
        <div className="flex flex-1 flex-col items-center justify-center px-5">
          <p className="text-xs text-emerald-400/80">
            Resurrection complete
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            {activeProject.owner}/{activeProject.name}
          </h1>
          <p className="mt-2 font-mono text-sm text-white/40">
            preview.remember.dev/{activeProject.owner}/{activeProject.name}
          </p>
          <div className="mt-8 flex gap-3">
            <CtaButton
              label="Open sandbox"
              onClick={() =>
                window.open(
                  activeProject.previewUrl ??
                    `https://github.com/${activeProject.owner}/${activeProject.name}`,
                  "_blank",
                )
              }
            />
            <Link
              to="/create"
              className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              New project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <ProjectSessionHeader
        sessionId={detail.sessionId}
        isLive={!!isLiveRace}
        projectLabel={`${activeProject.owner}/${activeProject.name}`}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          data-animate="project-col"
          data-side="left"
          className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0a0a0a] lg:w-72 lg:border-b-0 lg:border-r xl:w-80"
        >
          <Link
            to="/create/generated"
            className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5 text-xs text-white/40 transition-colors hover:text-white/70"
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
          className="min-h-0 min-w-0 flex-1 border-b border-white/10 bg-[#0a0a0a] lg:border-b-0"
        >
          <RepairRacePanel
            snapshotHash={detail.snapshotHash}
            lanes={detail.repairLanes}
            elapsedSeconds={detail.elapsedSeconds}
            estimatedSeconds={detail.estimatedSeconds}
            isEvaluating={activeProject.status === "repairing"}
          />
        </section>

        <aside
          data-animate="project-col"
          data-side="right"
          className="flex w-full shrink-0 flex-col bg-[#0a0a0a] lg:w-64 lg:border-l lg:border-white/10 xl:w-72"
        >
          <SafetyContextPanel checks={detail.safetyChecks} />
          <ProjectProfilePanel profile={detail.profile} />
        </aside>
      </div>
    </div>
  );
}
