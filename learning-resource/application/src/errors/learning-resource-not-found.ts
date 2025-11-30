import { BaseError } from "domain-lib";

export class LearningResourceNotFoundError extends BaseError<"LEARNING_RESOURCE_NOT_FOUND_ERROR"> {
  constructor(errors?: Record<string, string>) {
    super("LEARNING_RESOURCE_NOT_FOUND_ERROR", 404, errors);
  }
}
