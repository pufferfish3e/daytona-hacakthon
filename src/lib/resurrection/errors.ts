export class ResurrectionDeadlineError extends Error {
  public constructor(operation?: string) {
    super(operation === undefined
      ? "The eight-minute resurrection deadline was reached."
      : `The eight-minute resurrection deadline was reached during ${operation}.`);
    this.name = "ResurrectionDeadlineError";
  }
}

export class UnsupportedProjectError extends Error {
  public constructor() {
    super("This repository does not expose a supported deterministic install and start path.");
    this.name = "UnsupportedProjectError";
  }
}

export class RepairExecutorError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RepairExecutorError";
  }
}

export class ResurrectionOrchestrationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ResurrectionOrchestrationError";
  }
}

export class WinnerSelectionError extends Error {
  public constructor() {
    super("Cannot select a winner without a verified repair.");
    this.name = "WinnerSelectionError";
  }
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "An unknown resurrection error occurred.";

export const assertBeforeDeadline = (deadline: number, now: number): void => {
  if (now >= deadline) throw new ResurrectionDeadlineError();
};
