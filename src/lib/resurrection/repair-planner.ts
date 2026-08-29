import type { RepairPlan } from "@/lib/contracts/repair";
import type { ProjectProfile } from "@/lib/contracts/run";
import type { BaselineFailure } from "./baseline";
import type { RepoEvidence } from "./inspect";

export interface RepairPlannerInput {
  evidence: RepoEvidence;
  profile: ProjectProfile;
  failure: BaselineFailure;
  verifiedCapabilities: string[];
}

export interface RepairPlanner {
  plan(input: RepairPlannerInput): Promise<RepairPlan>;
}
