import { BaseError, type UUID } from "domain-lib";

export class SessionNotCompletedError extends BaseError<"SESSION_NOT_COMPLETED_ERROR"> {
  constructor(sessionId: UUID) {
    super("SESSION_NOT_COMPLETED_ERROR", 409, { sessionId });
  }
}
