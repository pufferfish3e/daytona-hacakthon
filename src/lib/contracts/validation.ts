export interface ValidationIssue {
  message: string;
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationIssue };

export interface RuntimeSchema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): SafeParseResult<T>;
}

export class ValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const createSchema = <T>(validator: (input: unknown) => T): RuntimeSchema<T> => ({
  parse(input: unknown): T {
    return validator(input);
  },
  safeParse(input: unknown): SafeParseResult<T> {
    try {
      return { success: true, data: validator(input) };
    } catch (error: unknown) {
      return { success: false, error: { message: errorMessage(error) } };
    }
  },
});

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Validation failed.";

export const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && !Array.isArray(input);

export const requireString = (input: unknown, field: string): string => {
  if (typeof input !== "string") {
    throw new ValidationError(`${field} must be a string.`);
  }
  return input;
};

export const requireStringArray = (input: unknown, field: string): string[] => {
  if (!Array.isArray(input) || input.some((item: unknown) => typeof item !== "string")) {
    throw new ValidationError(`${field} must be an array of strings.`);
  }
  return input;
};
