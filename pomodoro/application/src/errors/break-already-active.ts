import { BaseError, type UUID } from "domain-lib";

export class BreakAlreadyActiveError extends BaseError<"BREAK_ALREADY_ACTIVE_ERROR"> {
  constructor(activeBreakId: UUID) {
    super("BREAK_ALREADY_ACTIVE_ERROR", 409, { activeBreakId });
  }
}
