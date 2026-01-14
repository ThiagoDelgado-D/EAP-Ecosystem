import { BaseError } from "../base-error.js";

export class NotFoundError extends BaseError<"NOT_FOUND_ERROR"> {
  constructor(errors?: Record<string, string | undefined>) {
    super("NOT_FOUND_ERROR", 404, errors);
  }
}
