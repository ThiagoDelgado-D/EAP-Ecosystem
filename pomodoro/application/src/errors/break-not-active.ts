import { BaseError, type UUID } from "domain-lib";

export class BreakNotActiveError extends BaseError<"BREAK_NOT_ACTIVE_ERROR"> {
  constructor(breakId: UUID) {
    super("BREAK_NOT_ACTIVE_ERROR", 409, { breakId });
  }
}
