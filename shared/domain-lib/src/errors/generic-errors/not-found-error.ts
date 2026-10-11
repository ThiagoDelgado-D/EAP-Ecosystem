import { BaseError } from "../base-error.js";

export class NotFoundError extends BaseError<
  "NOT_FOUND_ERROR",
  { resource: string; id: string }
> {
  constructor(resource: string, id: string) {
    super("NOT_FOUND_ERROR", 404, { resource, id });
  }
}
