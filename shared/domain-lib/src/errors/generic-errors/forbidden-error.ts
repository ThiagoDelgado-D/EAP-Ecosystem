import { BaseError } from "../base-error.js";

export class ForbiddenError extends BaseError<"FORBIDDEN_ERROR"> {
  constructor() {
    super("FORBIDDEN_ERROR", 403);
  }
}
