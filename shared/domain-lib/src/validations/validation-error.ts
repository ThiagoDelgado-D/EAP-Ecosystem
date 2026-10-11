import { BaseError } from "../errors/index.js";

export class ValidationError extends BaseError<
  "VALIDATION_ERROR",
  { fields: Record<string, string> }
> {
  constructor(fields: Record<string, string>) {
    super("VALIDATION_ERROR", 400, { fields });
  }
}
