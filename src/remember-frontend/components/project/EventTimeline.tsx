import { Check, X, Circle } from "lucide-react";
import type { TimelineEvent } from "../../types/projectDetail";

function StatusIcon({ status }: { status: TimelineEvent["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-archive-success-border bg-archive-success-bg">
        <Check className="h-3 w-3 text-archive-success" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
        <X className="h-3 w-3 text-red-400" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-ping rounded-full bg-amber-500/20" />
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
          <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-archive-border bg-white/[0.04]">
      <Circle className="h-2 w-2 text-archive-faint" />
    </span>
  );
}

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <p className="accession-label">Event timeline</p>
      <ol className="relative mt-4 space-y-0">
        {events.map((event, i) => (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {i < events.length - 1 && (
              <span
                className={`absolute left-[10px] top-5 h-[calc(100%-4px)] w-px ${
                  event.status === "done" ? "bg-archive-border-strong" : "bg-archive-border"
                }`}
              />
            )}
            <div className="relative z-10 shrink-0">
              <StatusIcon status={event.status} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={`text-sm font-medium ${
                    event.status === "active"
                      ? "text-archive-ink"
                      : event.status === "pending"
                        ? "text-archive-faint"
                        : "text-archive-ink/80"
                  }`}
                >
                  {event.label}
                  {event.status === "active" && (
                    <span className="ml-1 text-archive-muted">(live)</span>
                  )}
                </p>
                {event.duration && (
                  <span className="shrink-0 font-mono text-[10px] text-archive-faint">
                    {event.duration}
                  </span>
                )}
              </div>
              {event.detail && (
                <p className="mt-0.5 text-xs leading-relaxed text-archive-muted">
                  {event.detail}
                </p>
              )}
              {event.timestamp && event.timestamp !== "—" && (
                <p className="mt-1 font-mono text-[10px] text-archive-faint">
                  {event.timestamp}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
