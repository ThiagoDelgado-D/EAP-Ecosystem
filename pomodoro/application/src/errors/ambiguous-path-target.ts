import { BaseError } from "domain-lib";
import type { LearningPathMembership } from "@pomodoro/domain";

export class AmbiguousPathTargetError extends BaseError<"AMBIGUOUS_PATH_TARGET_ERROR"> {
  constructor(candidates: LearningPathMembership[]) {
    super("AMBIGUOUS_PATH_TARGET_ERROR", 409, { candidates });
  }
}
