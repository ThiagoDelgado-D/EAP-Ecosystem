import { BaseError } from "domain-lib";

export class UserNotFoundError extends BaseError<"USER_NOT_FOUND_ERROR"> {
  constructor() {
    super("USER_NOT_FOUND_ERROR", 404);
  }
}
