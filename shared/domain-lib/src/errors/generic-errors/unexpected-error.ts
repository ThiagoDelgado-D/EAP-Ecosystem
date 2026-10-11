import { BaseError } from "../base-error.js";

export class UnexpectedError extends BaseError<"UNEXPECTED_ERROR"> {
  constructor() {
    super("UNEXPECTED_ERROR", 500);
  }
}
