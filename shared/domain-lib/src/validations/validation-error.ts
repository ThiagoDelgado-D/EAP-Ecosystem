import { BaseError } from "../errors/index.js";

/**
 * Error thrown when validation fails.
 * Contains detailed field-level errors.
 */
export class ValidationError extends BaseError<"VALIDATION_ERROR"> {
  constructor(
    public readonly errors: Record<string, string>,
    public readonly value: any
  ) {
    super("VALIDATION_ERROR", 400, errors);
  }
}
