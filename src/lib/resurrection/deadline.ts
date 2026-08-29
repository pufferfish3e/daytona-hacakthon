import { ResurrectionDeadlineError } from "./errors";

export async function withDeadline<T>(
  deadline: number,
  now: () => number,
  operationName: string,
  operation: () => Promise<T>,
): Promise<T> {
  const remainingMs = deadline - now();
  if (remainingMs <= 0) throw new ResurrectionDeadlineError(operationName);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((
    _resolve: (value: never | PromiseLike<never>) => void,
    reject: (reason?: unknown) => void,
  ): void => {
    timer = setTimeout((): void => reject(new ResurrectionDeadlineError(operationName)), remainingMs);
  });
  try {
    return await Promise.race([Promise.resolve().then(operation), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
