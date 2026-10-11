import { BaseError } from "domain-lib";

export class LearningResourceNotFoundError extends BaseError<"LEARNING_RESOURCE_NOT_FOUND_ERROR"> {
  constructor() {
    super("LEARNING_RESOURCE_NOT_FOUND_ERROR", 404);
  }
}
