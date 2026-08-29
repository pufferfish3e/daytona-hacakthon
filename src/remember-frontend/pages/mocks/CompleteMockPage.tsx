import { Link } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { ProjectSessionHeader } from "../../components/project/ProjectSessionHeader";
import { RepoSubmittedPanel } from "../../components/project/RepoSubmittedPanel";
import { EventTimeline } from "../../components/project/EventTimeline";
import { SafetyContextPanel } from "../../components/project/SafetyContextPanel";
import { ProjectProfilePanel } from "../../components/project/ProjectProfilePanel";
import { LivePreviewPanel } from "../../components/project/LivePreviewPanel";
import { COMPLETE_MOCK_DETAIL, COMPLETE_MOCK_PROJECT } from "../../data/completeMock";
import { useProjectPageAnimations } from "../../hooks/useProjectPageAnimations";
import { formatElapsed } from "../../data/projectDetail";

export function CompleteMockPage() {
  const rootRef = useProjectPageAnimations("mock-complete");
  const project = COMPLETE_MOCK_PROJECT;
  const detail = COMPLETE_MOCK_DETAIL;

  return (
    <div ref={rootRef} className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <ProjectSessionHeader
        sessionId={detail.sessionId}
        isLive={false}
        projectLabel={`${project.owner}/${project.name}`}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          data-animate="project-col"
          data-side="left"
          className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-[#0a0a0a] lg:flex xl:w-80"
        >
          <Link
            to="/create"
            className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5 text-xs text-white/40 transition-colors hover:text-white/70"
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
          className="min-h-0 min-w-0 flex-1"
        >
          <LivePreviewPanel
            owner={project.owner}
            name={project.name}
            previewUrl={project.previewUrl!}
          />
        </section>

        <aside
          data-animate="project-col"
          data-side="right"
          className="hidden w-64 shrink-0 flex-col border-l border-white/10 bg-[#0a0a0a] lg:flex xl:w-72"
        >
          <SafetyContextPanel checks={detail.safetyChecks} />
          <ProjectProfilePanel profile={detail.profile} />

          <div className="border-t border-white/10 p-4 sm:p-5">
            <p className="text-[10px] font-medium text-white/40">Repair summary</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Environment lane won the repair race in {formatElapsed(detail.elapsedSeconds)}.
            </p>
            <ul className="mt-4 space-y-2">
              {detail.repairLanes.map((lane) => (
                <li
                  key={lane.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                >
                  <span className="text-white/70">{lane.title}</span>
                  <span className="flex items-center gap-1 text-emerald-400/90">
                    <Check className="h-3 w-3" />
                    {lane.statusLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
