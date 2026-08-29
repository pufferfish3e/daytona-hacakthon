import { createSchema, isRecord, requireString, ValidationError } from "./validation";
import type { Invasiveness } from "./run";

export type RepairAction =
  | { type: "run_command"; command: string; reason: string }
  | { type: "write_file"; path: string; content: string; reason: string }
  | { type: "replace_text"; path: string; search: string; replacement: string; reason: string }
  | { type: "try_start"; command: string; expectedPorts: number[]; reason: string };

export interface RepairStrategy { id: "repair-a" | "repair-b" | "repair-c"; title: string; hypothesis: string; invasiveness: Invasiveness; actions: RepairAction[]; }
export interface RepairPlan { diagnosis: string; strategies: [RepairStrategy, RepairStrategy, RepairStrategy]; }

const STRATEGY_IDS = new Set(["repair-a", "repair-b", "repair-c"]);
const INVASIVENESS = new Set<Invasiveness>(["environment", "config", "dependency", "source"]);

const validateAction = (input: unknown): RepairAction => {
  if (!isRecord(input)) throw new ValidationError("Repair action must be an object.");
  const type = requireString(input.type, "action.type");
  const reason = requireNonEmpty(input.reason, "action.reason");
  if (type === "run_command") return { type, command: requireNonEmpty(input.command, "action.command"), reason };
  if (type === "write_file") return { type, path: requireNonEmpty(input.path, "action.path"), content: requireString(input.content, "action.content"), reason };
  if (type === "replace_text") return { type, path: requireNonEmpty(input.path, "action.path"), search: requireNonEmpty(input.search, "action.search"), replacement: requireString(input.replacement, "action.replacement"), reason };
  if (type !== "try_start") throw new ValidationError("Repair action type is invalid.");
  return { type, command: requireNonEmpty(input.command, "action.command"), expectedPorts: validatePorts(input.expectedPorts), reason };
};

const validateStrategy = (input: unknown): RepairStrategy => {
  if (!isRecord(input)) throw new ValidationError("Repair strategy must be an object.");
  const id = requireString(input.id, "strategy.id");
  const title = requireNonEmpty(input.title, "strategy.title");
  const hypothesis = requireNonEmpty(input.hypothesis, "strategy.hypothesis");
  const invasiveness = requireString(input.invasiveness, "strategy.invasiveness");
  if (!STRATEGY_IDS.has(id) || !INVASIVENESS.has(invasiveness as Invasiveness) || title.length > 80 || hypothesis.length > 400 || !Array.isArray(input.actions) || input.actions.length < 1 || input.actions.length > 8) throw new ValidationError("Repair strategy is invalid.");
  return { id: id as RepairStrategy["id"], title, hypothesis, invasiveness: invasiveness as Invasiveness, actions: input.actions.map(validateAction) };
};

const validatePlan = (input: unknown): RepairPlan => {
  if (!isRecord(input) || !Array.isArray(input.strategies) || input.strategies.length !== 3) throw new ValidationError("Repair plan requires exactly three strategies.");
  const diagnosis = requireNonEmpty(input.diagnosis, "diagnosis");
  const strategies = input.strategies.map(validateStrategy);
  const ids = new Set(strategies.map((strategy: RepairStrategy) => strategy.id));
  const titles = new Set(strategies.map((strategy: RepairStrategy) => strategy.title));
  if (ids.size !== 3 || titles.size !== 3) throw new ValidationError("Strategies must be meaningfully distinct.");
  return { diagnosis, strategies: [strategies[0], strategies[1], strategies[2]] };
};

const requireNonEmpty = (input: unknown, field: string): string => {
  const value = requireString(input, field);
  if (value.length === 0) throw new ValidationError(`${field} must not be empty.`);
  return value;
};

const validatePorts = (input: unknown): number[] => {
  if (!Array.isArray(input) || input.length === 0 || input.some((port: unknown) => typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535)) throw new ValidationError("expectedPorts must contain valid ports.");
  return input;
};

export const RepairPlanSchema = createSchema<RepairPlan>(validatePlan);
