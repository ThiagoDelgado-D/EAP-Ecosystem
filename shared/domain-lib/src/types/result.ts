/**
 * A Result type that can be either a success value or an error.
 * This is a discriminated union that allows type-safe error handling.
 */

export type Result<T, E extends Error = Error> = T | E;

/**
 * Type guard to check if a result is an error.
 *
 * @example
 * const result = await someOperation();
 * if (isErrorResult(result)) {
 *   console.error(result.message);
 *   return;
 * }
 * // result is now typed as T
 * console.log(result);
 */

export function isErrorResult<T, E extends Error>(
  result: Result<T, E>
): result is E {
  return result instanceof Error;
}
