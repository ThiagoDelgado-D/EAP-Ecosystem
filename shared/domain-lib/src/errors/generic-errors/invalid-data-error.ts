import { BaseError } from "../base-error.js";

export class InvalidDataError extends BaseError<"INVALID_DATA_ERROR"> {
  constructor(errors?: Record<string, string>) {
    super("INVALID_DATA_ERROR", 400, errors);
  }
}
