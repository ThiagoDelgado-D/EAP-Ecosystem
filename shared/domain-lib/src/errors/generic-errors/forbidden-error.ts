import { BaseError } from "../base-error.js";

export class ForbiddenError extends BaseError<"FORBIDDEN_ERROR"> {
  constructor(context?: Record<string, string>) {
    super("FORBIDDEN_ERROR", 403, context);
  }
}
