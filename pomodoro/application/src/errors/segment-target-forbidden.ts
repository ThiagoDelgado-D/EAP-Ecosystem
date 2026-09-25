import { BaseError } from "domain-lib";

export class SegmentTargetForbiddenError extends BaseError<"SEGMENT_TARGET_FORBIDDEN_ERROR"> {
  constructor() {
    super("SEGMENT_TARGET_FORBIDDEN_ERROR", 403);
  }
}
