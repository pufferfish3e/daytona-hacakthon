import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "../constants";

type TerminalLine = {
  text: string;
  type: "command" | "output" | "success";
  delay: number;
};

const LINES: TerminalLine[] = [
  { text: `remember rebuild acme/dashboard-v2`, type: "command", delay: 0 },
  { text: "cloning @ 2019-03-14…", type: "output", delay: 600 },
  { text: "mapping dependency tree (312 packages)", type: "output", delay: 1100 },
  { text: "patching node 10 → 18 LTS", type: "output", delay: 1700 },
  { text: "repairing 47 broken deps", type: "output", delay: 2300 },
  { text: "stubbing expired CDN endpoints", type: "output", delay: 2900 },
  { text: "quarantining 3 secrets", type: "output", delay: 3400 },
  { text: "sandbox: ready ✓", type: "success", delay: 4000 },
  { text: "preview: https://sandbox.remember.dev/acme-v2", type: "success", delay: 4600 },
];

const LINE_COLORS = {
  command: "text-white",
  output: "text-white/50",
  success: "text-emerald-400/90",
} as const;

type RebuildTerminalProps = {
  onVisible?: () => void;
};

export function RebuildTerminal({ onVisible }: RebuildTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [started, setStarted] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          onVisible?.();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started, onVisible]);

  useEffect(() => {
    if (!started) return;

    const timers = LINES.map((line, index) =>
      window.setTimeout(() => setVisibleLines(index + 1), line.delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const interval = window.setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [started]);

  return (
    <div
      ref={containerRef}
      data-animate="terminal"
      className="glass-panel overflow-hidden"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 font-mono text-xs text-white/30">rebuild — acme/dashboard-v2</span>
      </div>

      <div className="min-h-[280px] p-5 font-mono text-sm leading-relaxed sm:min-h-[300px] sm:p-6">
        {LINES.slice(0, visibleLines).map((line, index) => (
          <div key={index} className="mb-1.5 flex gap-2">
            {line.type === "command" ? (
              <>
                <span className="shrink-0 text-emerald-400/70">$</span>
                <span className={LINE_COLORS[line.type]}>{line.text}</span>
              </>
            ) : (
              <span className={`pl-4 ${LINE_COLORS[line.type]}`}>→ {line.text}</span>
            )}
          </div>
        ))}

        {started && visibleLines === 0 && (
          <div className="flex gap-2">
            <span className="text-emerald-400/70">$</span>
            <span className="text-white/30">{PRODUCT_NAME.toLowerCase()} rebuild </span>
            <span
              className={`inline-block h-4 w-2 bg-white/60 ${cursorVisible ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        )}

        {visibleLines > 0 && visibleLines < LINES.length && (
          <span
            className={`mt-1 inline-block h-4 w-2 bg-white/60 ${cursorVisible ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    </div>
  );
}
