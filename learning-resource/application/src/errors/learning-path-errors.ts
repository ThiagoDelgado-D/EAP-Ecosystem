import { BaseError } from "domain-lib";

export class LearningPathNotFoundError extends BaseError<"LEARNING_PATH_NOT_FOUND_ERROR"> {
  constructor() {
    super("LEARNING_PATH_NOT_FOUND_ERROR", 404);
  }
}

export class LearningPathForbiddenError extends BaseError<"LEARNING_PATH_FORBIDDEN_ERROR"> {
  constructor() {
    super("LEARNING_PATH_FORBIDDEN_ERROR", 403);
  }
}

export class LearningPathNodeNotFoundError extends BaseError<"LEARNING_PATH_NODE_NOT_FOUND_ERROR"> {
  constructor() {
    super("LEARNING_PATH_NODE_NOT_FOUND_ERROR", 404);
  }
}

export class LearningPathEdgeNotFoundError extends BaseError<"LEARNING_PATH_EDGE_NOT_FOUND_ERROR"> {
  constructor() {
    super("LEARNING_PATH_EDGE_NOT_FOUND_ERROR", 404);
  }
}

export class LearningPathCreationError extends BaseError<"LEARNING_PATH_CREATION_ERROR"> {
  constructor(errors: Record<string, string>) {
    super("LEARNING_PATH_CREATION_ERROR", 422, errors);
  }
}

export class DuplicateLearningPathEdgeError extends BaseError<"DUPLICATE_LEARNING_PATH_EDGE_ERROR"> {
  constructor() {
    super("DUPLICATE_LEARNING_PATH_EDGE_ERROR", 409);
  }
}
