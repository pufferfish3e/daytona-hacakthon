import { useCallback, useEffect, useRef, useState } from "react";
import { useIsEmbedded } from "../hooks/useIsEmbedded";
import { BonkyAchievements } from "./BonkyAchievements";
import { BonkyGame } from "./BonkyGame";
import { BonkyLeaderboard } from "./BonkyLeaderboard";
import { BonkyNavbar, type BonkyPage } from "./BonkyNavbar";
import { BonkyStats } from "./BonkyStats";
import { BonkyWaitingScreen } from "./BonkyWaitingScreen";
import { readBonkyStats, recordNewGame } from "./demo-storage";

function BonkyInlinePreview() {
  const gameHostRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState(() => {
    recordNewGame();
    return readBonkyStats();
  });
  const [isPlaying, setIsPlaying] = useState(true);

  const refreshStats = useCallback(() => setStats(readBonkyStats()), []);

  const startGame = useCallback(() => {
    recordNewGame();
    refreshStats();
    setIsPlaying(true);
  }, [refreshStats]);

  return (
    <div ref={gameHostRef} className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#454545]">
      {isPlaying ? (
        <BonkyGame
          containerRef={gameHostRef}
          embedded
          fillContainer
          onExit={() => setIsPlaying(false)}
          onStatsChange={refreshStats}
        />
      ) : (
        <div className="flex h-full flex-col gap-4 bg-[#f5f5f5] p-4">
          <BonkyStats stats={stats} />
          <BonkyWaitingScreen onStart={startGame} />
        </div>
      )}
    </div>
  );
}

type BonkyShellProps = {
  compact?: boolean;
  inIframe?: boolean;
};

function BonkyShell({ compact = false, inIframe = false }: BonkyShellProps) {
  const gameHostRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<BonkyPage>("game");
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState(readBonkyStats);

  const refreshStats = useCallback(() => setStats(readBonkyStats()), []);

  const startGame = useCallback(() => {
    recordNewGame();
    refreshStats();
    setIsPlaying(true);
  }, [refreshStats]);

  useEffect(() => {
    if (!inIframe) return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.height = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [inIframe]);

  return (
    <div
      className={`flex flex-col overflow-hidden bg-[#f5f5f5] text-gray-900 ${
        inIframe ? "fixed inset-0 h-[100dvh] w-full" : compact ? "h-full min-h-0 w-full" : "min-h-screen"
      }`}
    >
      <div className={`shrink-0 ${compact ? "p-2" : "px-3 py-4 sm:px-6 sm:py-6"}`}>
        <BonkyNavbar page={page} onNavigate={setPage} />
      </div>

      <div
        className={`min-h-0 flex-1 overflow-auto ${
          compact ? "flex flex-col gap-3 px-2 pb-2" : "mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-6 sm:px-6"
        }`}
      >
        {page === "game" && (
          <>
            {!isPlaying && (
              <div className="flex flex-col gap-4">
                <BonkyStats stats={stats} />
                <BonkyWaitingScreen onStart={startGame} />
              </div>
            )}
            {isPlaying && (
              <div
                ref={gameHostRef}
                className={compact ? "min-h-0 flex-1" : "min-h-[480px] w-full"}
              >
                <BonkyGame
                  containerRef={gameHostRef}
                  embedded={compact || inIframe}
                  fillContainer={compact && !inIframe}
                  onExit={() => setIsPlaying(false)}
                  onStatsChange={refreshStats}
                />
              </div>
            )}
          </>
        )}

        {page === "leaderboard" && <BonkyLeaderboard />}
        {page === "achievements" && <BonkyAchievements stats={stats} />}
      </div>
    </div>
  );
}

export function BonkyInuApp({
  forceEmbedded = false,
  fillContainer = false,
}: {
  forceEmbedded?: boolean;
  /** Fill parent panel instead of viewport (inline live preview). */
  fillContainer?: boolean;
} = {}) {
  const detectedEmbedded = useIsEmbedded();
  const embedded = forceEmbedded || detectedEmbedded;

  if (embedded && fillContainer) {
    return <BonkyInlinePreview />;
  }

  if (embedded) {
    return (
      <BonkyShell
        compact
        inIframe={detectedEmbedded && !fillContainer}
      />
    );
  }

  return <BonkyShell />;
}
