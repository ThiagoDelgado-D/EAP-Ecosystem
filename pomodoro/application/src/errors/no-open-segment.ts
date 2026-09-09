import { BaseError, type UUID } from "domain-lib";

export class NoOpenSegmentError extends BaseError<"NO_OPEN_SEGMENT_ERROR"> {
  constructor(sessionId: UUID) {
    super("NO_OPEN_SEGMENT_ERROR", 409, { sessionId });
  }
}
