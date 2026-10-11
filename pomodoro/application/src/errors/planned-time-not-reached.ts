import { BaseError, type UUID } from "domain-lib";

export class PlannedTimeNotReachedError extends BaseError<"PLANNED_TIME_NOT_REACHED_ERROR", { sessionId: UUID }> {
  constructor(sessionId: UUID) {
    super("PLANNED_TIME_NOT_REACHED_ERROR", 409, { sessionId });
  }
}
