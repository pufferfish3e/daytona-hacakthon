import type { BonkyDemoStats } from "./demo-storage";

type BonkyStatsProps = {
  stats: BonkyDemoStats;
};

export function BonkyStats({ stats }: BonkyStatsProps) {
  return (
    <div className="flex flex-wrap justify-around gap-3 text-center">
      <h2 className="mx-2 text-xs font-bold uppercase text-[#FA6E00] sm:text-sm md:text-xl">
        Game played: <strong>{stats.gamesPlayed}</strong>
      </h2>
      <h2 className="mx-2 text-xs font-bold uppercase text-[#FA6E00] sm:text-sm md:text-xl">
        Highscore: <strong>{stats.highscore}</strong>
      </h2>
      <h2 className="mx-2 text-xs font-bold uppercase text-[#FA6E00] sm:text-sm md:text-xl">
        Total $BONK Burned: <strong>{stats.totalBonkBurned}</strong>
      </h2>
    </div>
  );
}
