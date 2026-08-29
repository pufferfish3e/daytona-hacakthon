import type { SuccessfulRepair } from "./fork-repair";
import { WinnerSelectionError } from "./errors";
import { effectiveInvasiveness, INVASIVENESS_RANK } from "./invasiveness";

export { INVASIVENESS_RANK } from "./invasiveness";

export function selectWinner(successes: SuccessfulRepair[]): SuccessfulRepair {
  const winner = [...successes].sort(compareRepairs)[0];
  if (winner === undefined) throw new WinnerSelectionError();
  return winner;
}

const compareRepairs = (left: SuccessfulRepair, right: SuccessfulRepair): number =>
  INVASIVENESS_RANK[effectiveInvasiveness(left.strategy)] - INVASIVENESS_RANK[effectiveInvasiveness(right.strategy)] ||
  left.changedFiles.length - right.changedFiles.length ||
  left.bootDurationMs - right.bootDurationMs ||
  left.strategy.id.localeCompare(right.strategy.id);
