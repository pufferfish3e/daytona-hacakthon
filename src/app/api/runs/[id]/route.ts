import { FileRunStore } from "@/lib/store/file-run-store";
import type { ResurrectionRun } from "@/lib/contracts/run";
import { errorMessage } from "@/lib/contracts/validation";
import { resolveRunDirectory } from "@/lib/server/env";

const RUN_DIRECTORY = resolveRunDirectory();
const RUN_ID_PATTERN = /^run_[0-9a-f-]{36}$/;
const RUN_STORE = new FileRunStore(RUN_DIRECTORY);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  if (!RUN_ID_PATTERN.test(id)) return Response.json({ error: "Run not found." }, { status: 404 });
  let run: ResurrectionRun | undefined;
  try {
    run = await RUN_STORE.get(id);
  } catch (error: unknown) {
    console.error("resurrection API get run failed", { error: errorMessage(error) });
    return Response.json({ error: "Unable to read resurrection run." }, { status: 500 });
  }
  if (!run) return Response.json({ error: "Run not found." }, { status: 404 });
  return Response.json(run, { headers: { "Cache-Control": "no-store" } });
}
