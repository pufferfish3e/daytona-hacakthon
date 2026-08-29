import { CreateRunRequestSchema } from "@/lib/contracts/api";
import { errorMessage } from "@/lib/contracts/validation";
import { InvalidRepositoryUrlError } from "@/lib/github/parse-url";
import { createRun, type CreateRunDependencies } from "@/lib/jobs/start-run";
import { getDemoRunService } from "@/lib/demo/demo-run-service";
import { getProductionRunService } from "@/lib/server/production-run-service";

export const createPostRunHandler = (dependencies?: CreateRunDependencies) => async (request: Request): Promise<Response> => {
  if (!dependencies) return Response.json({ error: "Resurrection service is not configured." }, { status: 503 });
  const body = await parseRequestBody(request);
  if (!body.success) return Response.json({ error: body.error }, { status: 400 });
  try {
    return Response.json(await createRun(body.data.repoUrl, dependencies), { status: 202 });
  } catch (error: unknown) {
    if (error instanceof InvalidRepositoryUrlError) return Response.json({ error: error.message }, { status: 400 });
    logRouteFailure("create run", error);
    return Response.json({ error: "Unable to create resurrection run." }, { status: 500 });
  }
};

export const POST = createPostRunHandler(getDemoRunService() ?? getProductionRunService());

const parseRequestBody = async (request: Request): Promise<{ success: true; data: { repoUrl: string } } | { success: false; error: string }> => {
  try {
    const parsed = CreateRunRequestSchema.safeParse(await request.json());
    if (!parsed.success) return { success: false, error: errorMessage(parsed.error) };
    return parsed;
  } catch (error: unknown) {
    return { success: false, error: `Invalid JSON: ${errorMessage(error)}` };
  }
};

const logRouteFailure = (operation: string, error: unknown): void => {
  console.error(`resurrection API ${operation} failed`, { error: errorMessage(error) });
};
