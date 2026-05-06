import { BaseError } from "domain-lib";

export class ForbiddenError extends BaseError<"FORBIDDEN_ERROR"> {
  constructor() {
    super("FORBIDDEN_ERROR", 403);
  }
}
