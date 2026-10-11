import { BaseError, type UUID } from "domain-lib";

export class SegmentsAlreadyAttributedError extends BaseError<"SEGMENTS_ALREADY_ATTRIBUTED_ERROR", { sessionId: UUID }> {
  constructor(sessionId: UUID) {
    super("SEGMENTS_ALREADY_ATTRIBUTED_ERROR", 409, { sessionId });
  }
}
