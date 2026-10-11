import type { AnyBaseError } from "./base-error.js";

export function isError(error: unknown): error is AnyBaseError {
  return error instanceof Error;
}
