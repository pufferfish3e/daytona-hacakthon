import { useEffect, useRef } from "react";
import type { LogEntry } from "../types/dashboard";

const AGENT_COLORS: Record<LogEntry["agent"], string> = {
  ingest: "text-sky-400",
  repair: "text-amber-400",
  isolate: "text-violet-300",
  share: "text-emerald-400",
};

type AgentLogProps = {
  logs: LogEntry[];
  isActive?: boolean;
};

export function AgentLog({ logs, isActive = false }: AgentLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#050505]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-xs font-medium text-white/50">
          Agent activity
        </p>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Running
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <p className="text-white/30">Waiting for agents to start…</p>
        ) : (
          logs.map((entry, i) => (
            <div key={`${entry.ts}-${i}`} className="mb-2 flex gap-3">
              <span className="shrink-0 text-white/25">{entry.ts}</span>
              <span className={`shrink-0 ${AGENT_COLORS[entry.agent]}`}>
                {entry.agent}
              </span>
              <span className="text-white/70">{entry.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
