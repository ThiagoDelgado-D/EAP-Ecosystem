import { BaseError } from "../base-error";

export class UnauthorizedError extends BaseError<"UNAUTHORIZED_ERROR"> {
  constructor(errors?: Record<string, string>) {
    super("UNAUTHORIZED_ERROR", 401, errors);
  }
}
