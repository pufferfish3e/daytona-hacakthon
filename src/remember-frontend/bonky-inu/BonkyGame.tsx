/* Game loop ported from bonky-inu-devnet — interval-driven state updates match original imperative style. */
/* eslint-disable react-hooks/set-state-in-effect */
import { type RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { BonkyGameOver } from "./BonkyGameOver";
import { getGameLayout, randomObstacleHeight } from "./game-scale";
import { Inu } from "./Inu";
import { Obstacles } from "./Obstacles";
import { readBonkyStats, recordHighscore } from "./demo-storage";
import { useGameDimensions } from "./useGameDimensions";

type BonkyGameProps = {
  containerRef?: RefObject<HTMLDivElement | null>;
  embedded?: boolean;
  fillContainer?: boolean;
  onExit: () => void;
  onStatsChange: () => void;
};

export function BonkyGame({
  containerRef,
  embedded = false,
  fillContainer = false,
  onExit,
  onStatsChange,
}: BonkyGameProps) {
  const measured = useGameDimensions(containerRef, embedded, fillContainer);
  const layout = useMemo(
    () => getGameLayout(measured.width, measured.height, measured.compact),
    [measured.compact, measured.height, measured.width],
  );

  const [highscore, setHighscore] = useState(() => readBonkyStats().highscore);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [revived, setRevived] = useState(false);

  const {
    gap,
    gravity,
    height,
    inuHeight,
    inuLeft,
    inuWidth,
    jumpBoost,
    obstacleSpeed,
    obstacleWidth,
    width,
    compact,
  } = layout;

  const [obstacleHeight, setObstacleHeight] = useState(() => randomObstacleHeight(height, gap));
  const [obstacleHeightTwo, setObstacleHeightTwo] = useState(() => randomObstacleHeight(height, gap));
  const [inuBottom, setInuBottom] = useState(height / 2);
  const [obstaclesLeft, setObstaclesLeft] = useState(width - obstacleWidth);
  const [obstaclesLeftTwo, setObstaclesLeftTwo] = useState(width / 2 - obstacleWidth / 2);

  const gameOver = useCallback(() => setIsGameOver(true), []);

  useEffect(() => {
    setInuBottom(height / 2);
    setObstaclesLeft(width - obstacleWidth);
    setObstaclesLeftTwo(width / 2 - obstacleWidth / 2);
    setObstacleHeight(randomObstacleHeight(height, gap));
    setObstacleHeightTwo(randomObstacleHeight(height, gap));
  }, [gap, height, obstacleWidth, width]);

  useEffect(() => {
    if (inuBottom <= -inuHeight / 2) return;
    const timer = window.setInterval(() => {
      setInuBottom((prev) => prev - gravity);
    }, 30);
    return () => window.clearInterval(timer);
  }, [gravity, inuBottom, inuHeight]);

  useEffect(() => {
    if (isGameOver) return;
    if (obstaclesLeft > -obstacleWidth) {
      const timer = window.setInterval(() => {
        setObstaclesLeft((prev) => prev - obstacleSpeed);
      }, 30);
      return () => window.clearInterval(timer);
    }
    setCurrentScore((prev) => prev + 1);
    setObstaclesLeft(width - obstacleWidth);
    setObstacleHeight(randomObstacleHeight(height, gap));
  }, [height, gap, isGameOver, obstacleSpeed, obstacleWidth, obstaclesLeft, width]);

  useEffect(() => {
    if (isGameOver) return;
    if (obstaclesLeftTwo > -obstacleWidth) {
      const timer = window.setInterval(() => {
        setObstaclesLeftTwo((prev) => prev - obstacleSpeed);
      }, 30);
      return () => window.clearInterval(timer);
    }
    setCurrentScore((prev) => prev + 1);
    setObstaclesLeftTwo(width - obstacleWidth);
    setObstacleHeightTwo(randomObstacleHeight(height, gap));
  }, [height, gap, isGameOver, obstacleSpeed, obstacleWidth, obstaclesLeftTwo, width]);

  useEffect(() => {
    const hitMargin = inuLeft + 55;
    const hitFirst =
      (inuBottom < obstacleHeight - inuHeight / 2 ||
        inuBottom > obstacleHeight - (3 * inuHeight) / 2 + gap) &&
      obstaclesLeft > inuLeft - obstacleWidth &&
      obstaclesLeft < hitMargin;
    const hitSecond =
      (inuBottom < obstacleHeightTwo - inuHeight / 2 ||
        inuBottom > obstacleHeightTwo - (3 * inuHeight) / 2 + gap) &&
      obstaclesLeftTwo > inuLeft - obstacleWidth &&
      obstaclesLeftTwo < hitMargin;

    if (hitFirst || hitSecond || inuBottom <= -inuHeight / 2) {
      gameOver();
    }
  }, [
    gap,
    gameOver,
    inuBottom,
    inuHeight,
    inuLeft,
    obstacleHeight,
    obstacleHeightTwo,
    obstacleWidth,
    obstaclesLeft,
    obstaclesLeftTwo,
  ]);

  const jump = () => {
    if (!isGameOver && inuBottom < height) {
      setInuBottom((prev) => prev + jumpBoost);
    }
  };

  const handleRevive = () => {
    setObstaclesLeftTwo(width / 2 - obstacleWidth / 2);
    setObstaclesLeft(width - obstacleWidth);
    setInuBottom(height / 2);
    setRevived(true);
    setIsGameOver(false);
  };

  const handleSaveHighscore = () => {
    const next = recordHighscore(currentScore);
    setHighscore(next.highscore);
    onStatsChange();
    onExit();
  };

  const canvas = (
    <div
      className="relative overflow-hidden bg-[#454545]"
      style={{ height, width }}
    >
      {!isGameOver ? (
        <button
          type="button"
          className="block h-full w-full cursor-pointer border-0 bg-transparent p-0"
          onClick={jump}
        >
          <div
            className="absolute z-[1] font-extrabold text-white"
            style={{
              fontSize: compact ? "1.75rem" : "2.25rem",
              left: width / 2,
              top: compact ? 12 : 24,
            }}
          >
            {currentScore}
          </div>
          <Inu inuBottom={inuBottom} inuLeft={inuLeft} inuHeight={inuHeight} inuWidth={inuWidth} />
          <Obstacles
            obstacleHeight={obstacleHeight}
            obstacleWidth={obstacleWidth}
            obstaclesLeft={obstaclesLeft}
            gap={gap}
            height={height}
          />
          <Obstacles
            obstacleHeight={obstacleHeightTwo}
            obstacleWidth={obstacleWidth}
            obstaclesLeft={obstaclesLeftTwo}
            gap={gap}
            height={height}
          />
        </button>
      ) : (
        <>
          <BonkyGameOver
            compact={compact}
            currentScore={currentScore}
            highscore={highscore}
            revived={revived}
            onRevive={handleRevive}
            onSaveHighscore={handleSaveHighscore}
            onPlayAgain={onExit}
          />
          <Inu inuBottom={inuBottom} inuLeft={inuLeft} inuHeight={inuHeight} inuWidth={inuWidth} />
          <Obstacles
            obstacleHeight={obstacleHeight}
            obstacleWidth={obstacleWidth}
            obstaclesLeft={obstaclesLeft}
            gap={gap}
            height={height}
          />
          <Obstacles
            obstacleHeight={obstacleHeightTwo}
            obstacleWidth={obstacleWidth}
            obstaclesLeft={obstaclesLeftTwo}
            gap={gap}
            height={height}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-[#454545]">
      {canvas}
    </div>
  );
}
