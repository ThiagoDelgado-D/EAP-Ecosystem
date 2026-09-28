import { BaseError } from "domain-lib";

export class RecommendationContextNotFoundError extends BaseError<"RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR"> {
  constructor() {
    super("RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR", 404);
  }
}
