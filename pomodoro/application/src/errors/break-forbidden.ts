import { BaseError } from "domain-lib";

export class BreakForbiddenError extends BaseError<"BREAK_FORBIDDEN_ERROR"> {
  constructor() {
    super("BREAK_FORBIDDEN_ERROR", 403);
  }
}
