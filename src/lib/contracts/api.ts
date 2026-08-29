import { createSchema, isRecord, requireString, ValidationError } from "./validation";

export interface CreateRunRequest { repoUrl: string; }
export interface CreateRunResponse { id: string; }

const RUN_ID_PATTERN = /^run_[0-9a-f-]{36}$/;

const validateCreateRunRequest = (input: unknown): CreateRunRequest => {
  if (!isRecord(input) || Object.keys(input).length !== 1 || !("repoUrl" in input)) throw new ValidationError("Request must contain only repoUrl.");
  const repoUrl = requireString(input.repoUrl, "repoUrl");
  if (repoUrl.length < 1 || repoUrl.length > 300) throw new ValidationError("repoUrl must be between 1 and 300 characters.");
  return { repoUrl };
};

const validateCreateRunResponse = (input: unknown): CreateRunResponse => {
  if (!isRecord(input) || Object.keys(input).length !== 1 || !("id" in input)) throw new ValidationError("Response must contain only id.");
  const id = requireString(input.id, "id");
  if (!RUN_ID_PATTERN.test(id)) throw new ValidationError("Run id is invalid.");
  return { id };
};

export const CreateRunRequestSchema = createSchema<CreateRunRequest>(validateCreateRunRequest);
export const CreateRunResponseSchema = createSchema<CreateRunResponse>(validateCreateRunResponse);
export const RunResponseSchema = CreateRunResponseSchema;
