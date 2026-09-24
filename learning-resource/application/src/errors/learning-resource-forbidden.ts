import { BaseError } from "domain-lib";

export class LearningResourceForbiddenError extends BaseError<"LEARNING_RESOURCE_FORBIDDEN_ERROR"> {
  constructor() {
    super("LEARNING_RESOURCE_FORBIDDEN_ERROR", 403);
  }
}
