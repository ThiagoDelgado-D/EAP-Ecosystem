import type { BaseError } from "./base-error";

export function isError(error: unknown): error is BaseError {
  return error instanceof Error;
}
