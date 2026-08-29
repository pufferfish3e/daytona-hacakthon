import type { BonkyDemoStats } from "./demo-storage";

const ACHIEVEMENTS = [
  { id: "a1", title: "First flight", requirement: "Play 1 game", check: (s: BonkyDemoStats) => s.gamesPlayed >= 1 },
  { id: "a2", title: "Double digits", requirement: "Score 10+", check: (s: BonkyDemoStats) => s.highscore >= 10 },
  { id: "a3", title: "Bonk burner", requirement: "Burn 1+ $BONK", check: (s: BonkyDemoStats) => s.totalBonkBurned >= 1 },
  { id: "a4", title: "Season regular", requirement: "Play 10 games", check: (s: BonkyDemoStats) => s.gamesPlayed >= 10 },
  { id: "a5", title: "Sky pup", requirement: "Score 20+", check: (s: BonkyDemoStats) => s.highscore >= 20 },
  { id: "a6", title: "Devnet degen", requirement: "Play 25 games", check: (s: BonkyDemoStats) => s.gamesPlayed >= 25 },
];

type BonkyAchievementsProps = {
  stats: BonkyDemoStats;
};

export function BonkyAchievements({ stats }: BonkyAchievementsProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-center text-2xl font-bold uppercase text-[#FA6E00]">Achievements</h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        Minted on-chain in the original — unlocked locally in this resurrection demo
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = achievement.check(stats);
          return (
            <div
              key={achievement.id}
              className={`rounded-xl border p-4 ${
                unlocked
                  ? "border-[#FA6E00]/40 bg-orange-50"
                  : "border-gray-200 bg-gray-50 opacity-70"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#FA6E00]">
                {unlocked ? "Unlocked" : "Locked"}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">{achievement.title}</p>
              <p className="mt-1 text-sm text-gray-600">{achievement.requirement}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
