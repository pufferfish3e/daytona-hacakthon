import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ProjectSessionHeader } from "../../components/project/ProjectSessionHeader";
import { RepoSubmittedPanel } from "../../components/project/RepoSubmittedPanel";
import { EventTimeline } from "../../components/project/EventTimeline";
import { SafetyContextPanel } from "../../components/project/SafetyContextPanel";
import { ProjectProfilePanel } from "../../components/project/ProjectProfilePanel";
import { LivePreviewPanel } from "../../components/project/LivePreviewPanel";
import { ResurrectionSummary } from "../../components/project/ResurrectionSummary";
import {
  COMPLETE_MOCK_DETAIL,
  COMPLETE_MOCK_MANIFEST,
  COMPLETE_MOCK_PROJECT,
} from "../../data/completeMock";
import { previewUrlForProject } from "../../lib/preview-url";
import { WorkspaceIframeGuard } from "../../components/WorkspaceIframeGuard";
import { useProjectPageAnimations } from "../../hooks/useProjectPageAnimations";

export function CompleteMockPage() {
  const rootRef = useProjectPageAnimations("mock-complete");
  const project = COMPLETE_MOCK_PROJECT;
  const detail = COMPLETE_MOCK_DETAIL;
  const manifest = COMPLETE_MOCK_MANIFEST;

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
        projectLabel={`${project.owner}/${project.name}`}
        showPause={false}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          data-animate="project-col"
          data-side="left"
          className="order-2 hidden w-72 shrink-0 flex-col border-r border-archive-border lg:order-none lg:flex xl:w-80"
        >
          <Link
            to="/create"
            className="flex items-center gap-1.5 border-b border-archive-border px-4 py-2.5 text-xs text-archive-muted transition-colors hover:text-archive-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to discover
          </Link>
          <RepoSubmittedPanel project={project} detail={detail} />
          <EventTimeline events={detail.timeline} />
        </aside>

        <section
          data-animate="project-col"
          data-side="center"
          className="order-1 min-h-0 min-w-0 flex-1 lg:order-none"
        >
          <LivePreviewPanel
            owner={project.owner}
            name={project.name}
            previewUrl={previewUrlForProject(project.previewUrl)}
          />
        </section>

        <aside
          data-animate="project-col"
          data-side="right"
          className="order-3 hidden w-72 shrink-0 flex-col border-l border-archive-border xl:order-none xl:flex"
        >
          <SafetyContextPanel checks={detail.safetyChecks} />
          <ProjectProfilePanel profile={detail.profile} />
          <ResurrectionSummary
            manifest={manifest}
            owner={project.owner}
            name={project.name}
          />
        </aside>
      </div>
    </div>
    </WorkspaceIframeGuard>
  );
}
