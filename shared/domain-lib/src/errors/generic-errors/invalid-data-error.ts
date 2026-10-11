import { BaseError } from "../base-error.js";

export class InvalidDataError extends BaseError<
  "INVALID_DATA_ERROR",
  { fields: Record<string, string> }
> {
  constructor(fields: Record<string, string>) {
    super("INVALID_DATA_ERROR", 400, { fields });
  }
}
