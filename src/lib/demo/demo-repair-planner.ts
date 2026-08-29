import type { RepairPlan } from "@/lib/contracts/repair";
import type { RepairPlanner, RepairPlannerInput } from "@/lib/resurrection/repair-planner";

const DEMO_REPAIR_PLAN: RepairPlan = {
  diagnosis: "The demo baseline is designed to pass; repair strategies are not used.",
  strategies: [
    { actions: [{ command: "npm run dev", expectedPorts: [3000], reason: "Demo fallback only.", type: "try_start" }], hypothesis: "Retry the detected start command.", id: "repair-a", invasiveness: "environment", title: "Retry baseline" },
    { actions: [{ command: "npm run dev", expectedPorts: [3000], reason: "Demo fallback only.", type: "try_start" }], hypothesis: "Retry the detected start command in a fresh fork.", id: "repair-b", invasiveness: "config", title: "Retry fresh fork" },
    { actions: [{ command: "npm run dev", expectedPorts: [3000], reason: "Demo fallback only.", type: "try_start" }], hypothesis: "Retry the detected start command with bounded verification.", id: "repair-c", invasiveness: "dependency", title: "Retry verification" },
  ],
};

export class DemoRepairPlanner implements RepairPlanner {
  public async plan(_input: RepairPlannerInput): Promise<RepairPlan> {
    void _input;
    return DEMO_REPAIR_PLAN;
  }
}
