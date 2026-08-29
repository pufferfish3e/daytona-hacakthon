type BonkyGameOverProps = {
  compact: boolean;
  currentScore: number;
  highscore: number;
  revived: boolean;
  onRevive: () => void;
  onSaveHighscore: () => void;
  onPlayAgain: () => void;
};

export function BonkyGameOver({
  compact,
  currentScore,
  highscore,
  revived,
  onRevive,
  onSaveHighscore,
  onPlayAgain,
}: BonkyGameOverProps) {
  const isNewHighscore = currentScore > highscore;
  const buttonClass = compact
    ? "rounded-lg bg-[#223333] px-3 py-2 text-[10px] font-bold uppercase text-white shadow-md"
    : "rounded-xl bg-[#223333] px-4 py-2.5 text-xs font-bold uppercase text-white shadow-xl sm:text-sm";
  const disabledClass = compact
    ? "cursor-not-allowed rounded-lg bg-[#657171] px-3 py-2 text-[10px] font-bold uppercase text-white shadow-md"
    : "cursor-not-allowed rounded-xl bg-[#657171] px-4 py-2.5 text-xs font-bold uppercase text-white shadow-xl sm:text-sm";

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 p-3">
      <div className="flex max-h-full w-full max-w-xs flex-col gap-3 overflow-y-auto rounded-2xl border-4 border-[#a04400] bg-[#c85800] p-4 shadow-2xl sm:max-w-sm sm:gap-4 sm:p-5">
        <h2 className={`text-center font-bold text-white ${compact ? "text-xl" : "text-2xl sm:text-4xl"}`}>
          Game Over
        </h2>
        <p className={`font-semibold text-white ${compact ? "text-sm" : "text-lg sm:text-2xl"}`}>
          Score: {currentScore}
        </p>
        {isNewHighscore ? (
          <div>
            <p className="text-xs font-bold text-[#03CC19] sm:text-sm">NEW</p>
            <p className={`font-semibold text-[#03CC19] ${compact ? "text-sm" : "text-lg sm:text-2xl"}`}>
              Highscore: {currentScore}
            </p>
          </div>
        ) : (
          <p className={`font-semibold text-white ${compact ? "text-sm" : "text-lg sm:text-2xl"}`}>
            Highscore: {highscore}
          </p>
        )}
        <div className="mt-1 flex flex-col gap-2">
          {!revived ? (
            <button type="button" className={buttonClass} onClick={onRevive}>
              Revive
            </button>
          ) : (
            <button type="button" className={disabledClass} disabled>
              {isNewHighscore ? "Revival already used" : "Revived already used"}
            </button>
          )}
          {isNewHighscore ? (
            <button type="button" className={buttonClass} onClick={onSaveHighscore}>
              Save Highscore
            </button>
          ) : null}
          <button type="button" className={buttonClass} onClick={onPlayAgain}>
            Play New Game
          </button>
        </div>
      </div>
    </div>
  );
}
