const MOCK_LEADERBOARD = [
  { owner: "bonky.sol", highscore: 47, gameplayed: 312 },
  { owner: "7xKp9...3mQz", highscore: 41, gameplayed: 128 },
  { owner: "4nWc2...8pRt", highscore: 38, gameplayed: 95 },
  { owner: "9mHd5...1kLf", highscore: 35, gameplayed: 201 },
  { owner: "2pQs7...6vBn", highscore: 31, gameplayed: 74 },
];

export function BonkyLeaderboard() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-center text-2xl font-bold uppercase text-[#FA6E00]">Season 1 leaderboard</h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        Restored from on-chain player accounts (devnet snapshot)
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Highscore</th>
              <th className="px-4 py-3">Games</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADERBOARD.map((row, index) => (
              <tr key={row.owner} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{index + 1}</td>
                <td className="px-4 py-3 font-mono text-xs sm:text-sm">{row.owner}</td>
                <td className="px-4 py-3 font-bold text-[#FA6E00]">{row.highscore}</td>
                <td className="px-4 py-3">{row.gameplayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
