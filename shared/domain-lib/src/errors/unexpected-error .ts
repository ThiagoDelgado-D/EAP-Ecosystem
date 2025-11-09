import { BaseError } from "./base-error";

export class UnexpectedError extends BaseError<"UNEXPECTED_ERROR"> {
  constructor(errors?: Record<string, string>) {
    super("UNEXPECTED_ERROR", 500, errors);
  }
}
