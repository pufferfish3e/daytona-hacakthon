export interface GameLayout {
  compact: boolean;
  gap: number;
  gravity: number;
  height: number;
  inuHeight: number;
  inuLeft: number;
  inuWidth: number;
  jumpBoost: number;
  obstacleSpeed: number;
  obstacleWidth: number;
  width: number;
}

const BASE_HEIGHT = 480;
const BASE_WIDTH = 640;

export const normalizePlayableSize = (
  containerWidth: number,
  containerHeight: number,
  embedded: boolean,
): { compact: boolean; height: number; width: number } => {
  const minHeight = embedded ? 280 : 360;
  const maxAspect = 2.1;
  const minAspect = 1.1;

  let width = Math.max(containerWidth, 280);
  let height = Math.max(containerHeight, minHeight);

  if (embedded) {
    height = containerHeight > 0 ? containerHeight : minHeight;
    width = containerWidth > 0 ? containerWidth : BASE_WIDTH;
  }

  const aspect = width / height;
  if (aspect > maxAspect) width = height * maxAspect;
  if (aspect < minAspect) height = width / minAspect;

  return {
    compact: height < 420,
    height: Math.floor(height),
    width: Math.floor(width),
  };
};

export const getGameLayout = (width: number, height: number, compact: boolean): GameLayout => {
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

  return {
    compact,
    gap: Math.max(72, Math.min(200, height * 0.36)),
    gravity: height / 134.5,
    height,
    inuHeight: Math.max(32, Math.min(60, 60 * scale)),
    inuLeft: Math.max(8, width * 0.02),
    inuWidth: Math.max(26, Math.min(50, 50 * scale)),
    jumpBoost: Math.max(36, height * 0.11),
    obstacleSpeed: Math.max(2, width / 132),
    obstacleWidth: Math.max(56, Math.min(150, width * 0.17)),
    width,
  };
};

export const randomObstacleHeight = (height: number, gap: number): number => {
  const margin = height / 6;
  const range = height - gap - margin - margin;
  if (range <= 0) return margin;
  return Math.random() * range + margin;
};
