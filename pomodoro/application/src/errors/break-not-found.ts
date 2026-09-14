import { BaseError } from "domain-lib";

export class BreakNotFoundError extends BaseError<"BREAK_NOT_FOUND_ERROR"> {
  constructor() {
    super("BREAK_NOT_FOUND_ERROR", 404);
  }
}
