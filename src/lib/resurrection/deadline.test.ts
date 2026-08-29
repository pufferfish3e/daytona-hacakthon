import { describe, expect, it, vi } from "vitest";

import { withDeadline } from "./deadline";

describe("withDeadline", () => {
  it("does not start an operation after the deadline", async () => {
    let isStarted = false;

    await expect(withDeadline(10, (): number => 10, "test operation", async (): Promise<void> => {
      isStarted = true;
    })).rejects.toThrow("test operation");
    expect(isStarted).toBe(false);
  });

  it("settles a hanging operation at the remaining deadline", async () => {
    vi.useFakeTimers();
    try {
      const result = withDeadline(100, (): number => 0, "hanging operation", () =>
        new Promise<string>(() => undefined));
      const rejection = expect(result).rejects.toThrow("hanging operation");
      await vi.advanceTimersByTimeAsync(100);
      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });
});
