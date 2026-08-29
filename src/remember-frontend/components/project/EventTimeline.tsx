import { Check, X, Circle } from "lucide-react";
import type { TimelineEvent } from "../../types/projectDetail";

function StatusIcon({ status }: { status: TimelineEvent["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
        <Check className="h-3 w-3 text-emerald-400" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
        <X className="h-3 w-3 text-red-400" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-ping rounded-full bg-amber-400/20" />
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/15">
          <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
      <Circle className="h-2 w-2 text-white/20" />
    </span>
  );
}

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <p className="text-[10px] font-medium text-white/40">
        Event timeline
      </p>
      <ol className="relative mt-4 space-y-0">
        {events.map((event, i) => (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {i < events.length - 1 && (
              <span
                className={`absolute left-[10px] top-5 h-[calc(100%-4px)] w-px ${
                  event.status === "done" ? "bg-white/15" : "bg-white/10"
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
                      ? "text-white"
                      : event.status === "pending"
                        ? "text-white/35"
                        : "text-white/80"
                  }`}
                >
                  {event.label}
                  {event.status === "active" && (
                    <span className="ml-1 text-white/40">(live)</span>
                  )}
                </p>
                {event.duration && (
                  <span className="shrink-0 font-mono text-[10px] text-white/30">
                    {event.duration}
                  </span>
                )}
              </div>
              {event.detail && (
                <p className="mt-0.5 text-xs leading-relaxed text-white/40">{event.detail}</p>
              )}
              {event.timestamp && event.timestamp !== "—" && (
                <p className="mt-1 font-mono text-[10px] text-white/25">{event.timestamp}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
