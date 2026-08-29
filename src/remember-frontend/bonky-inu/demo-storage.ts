export type BonkyDemoStats = {
  gamesPlayed: number;
  highscore: number;
  totalBonkBurned: number;
};

const STORAGE_KEY = "remember-bonky-demo-stats";

const DEFAULT_STATS: BonkyDemoStats = {
  gamesPlayed: 12,
  highscore: 18,
  totalBonkBurned: 1.2,
};

export function readBonkyStats(): BonkyDemoStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) } as BonkyDemoStats;
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_STATS };
}

export function writeBonkyStats(stats: BonkyDemoStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordNewGame(): BonkyDemoStats {
  const next = {
    ...readBonkyStats(),
    gamesPlayed: readBonkyStats().gamesPlayed + 1,
    totalBonkBurned: Math.round((readBonkyStats().totalBonkBurned + 0.1) * 10) / 10,
  };
  writeBonkyStats(next);
  return next;
}

export function recordHighscore(score: number): BonkyDemoStats {
  const current = readBonkyStats();
  const next = {
    ...current,
    highscore: Math.max(current.highscore, score),
  };
  writeBonkyStats(next);
  return next;
}
