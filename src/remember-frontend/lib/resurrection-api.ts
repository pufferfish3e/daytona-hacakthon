import type { ResurrectionRun } from "@/lib/contracts/run";

export class ResurrectionApiError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ResurrectionApiError";
  }
}

const getErrorMessage = async (response: Response): Promise<string> => {
  const payload: unknown = await response.json().catch((): null => null);
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return `Request failed (${response.status}).`;
};

const isResurrectionRun = (input: unknown): input is ResurrectionRun =>
  typeof input === "object" &&
  input !== null &&
  "id" in input &&
  typeof input.id === "string" &&
  "status" in input &&
  typeof input.status === "string";

export const createResurrectionRun = async (repoUrl: string): Promise<{ id: string }> => {
  const response = await fetch("/api/runs", {
    body: JSON.stringify({ repoUrl }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new ResurrectionApiError(await getErrorMessage(response));
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("id" in payload) || typeof payload.id !== "string") {
    throw new ResurrectionApiError("The create-run response was invalid.");
  }
  return { id: payload.id };
};

export const fetchResurrectionRun = async (id: string): Promise<ResurrectionRun> => {
  const response = await fetch(`/api/runs/${id}`, { cache: "no-store" });
  if (!response.ok) throw new ResurrectionApiError(await getErrorMessage(response));
  const payload: unknown = await response.json();
  if (!isResurrectionRun(payload)) throw new ResurrectionApiError("The run response was invalid.");
  return payload;
};
