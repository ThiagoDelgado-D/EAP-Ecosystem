import { BaseError } from "domain-lib";

export class TopicNotFoundError extends BaseError<"TOPIC_NOT_FOUND_ERROR"> {
  constructor() {
    super("TOPIC_NOT_FOUND_ERROR", 404);
  }
}

export class DuplicateTopicNameError extends BaseError<"DUPLICATE_TOPIC_NAME_ERROR"> {
  constructor() {
    super("DUPLICATE_TOPIC_NAME_ERROR", 409);
  }
}
