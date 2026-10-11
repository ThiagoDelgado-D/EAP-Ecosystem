import { BaseError } from "../base-error.js";

export class UnauthorizedError extends BaseError<"UNAUTHORIZED_ERROR"> {
  constructor() {
    super("UNAUTHORIZED_ERROR", 401);
  }
}
