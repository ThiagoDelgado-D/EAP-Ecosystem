import { BaseError } from "domain-lib";

export class EmailAlreadyExistsError extends BaseError<"EMAIL_ALREADY_EXISTS_ERROR"> {
  constructor(errors?: Record<string, string>) {
    super("EMAIL_ALREADY_EXISTS_ERROR", 409, errors);
  }
}
