import { describe, expect, it, vi } from "vitest";

import { DaytonaProvider } from "./daytona-provider";
import type { DaytonaClient, DaytonaSandboxClient } from "./client";

const createSandboxClient = (id: string, name: string, forkImpl?: (name: string) => Promise<DaytonaSandboxClient>): DaytonaSandboxClient => ({
  cloneRepository: vi.fn(),
  createSession: vi.fn(),
  createSnapshot: vi.fn(),
  delete: vi.fn(),
  downloadFile: vi.fn(),
  executeCommand: vi.fn(),
  executeSessionCommand: vi.fn(),
  fork: forkImpl ?? vi.fn(async (forkName: string): Promise<DaytonaSandboxClient> => createSandboxClient(`${id}-fork`, forkName)),
  getSessionCommand: vi.fn(),
  getSessionCommandLogs: vi.fn(),
  getSignedPreviewUrl: vi.fn(),
  id,
  listFiles: vi.fn(),
  name,
  stop: vi.fn(),
  uploadTextFile: vi.fn(),
});

describe("DaytonaProvider", () => {
  it("falls back to creating a sandbox from snapshot when fork is unsupported", async () => {
    const seed = createSandboxClient("seed-1", "seed", async (): Promise<DaytonaSandboxClient> => {
      throw new Error("Forking is not supported for this sandbox");
    });
    const restored = createSandboxClient("restored-1", "baseline");
    const createSandboxFromSnapshot = vi.fn(async (): Promise<DaytonaSandboxClient> => restored);
    const client: DaytonaClient = {
      createSandbox: vi.fn(async (): Promise<DaytonaSandboxClient> => seed),
      createSandboxFromSnapshot,
      deleteSnapshot: vi.fn(),
    };
    const provider = new DaytonaProvider(client);
    const seedRef = await provider.createSeed({ cpu: 2, diskGiB: 10, memoryGiB: 4, name: "seed", ttlMinutes: 15 });
    await provider.createSnapshot(seedRef, "resurrection-s0");

    const forkRef = await provider.fork(seedRef, "baseline");

    expect(forkRef.id).toBe("restored-1");
    expect(createSandboxFromSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      name: "baseline",
      snapshot: "resurrection-s0",
    }));
  });
});
