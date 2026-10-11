import { HttpException } from "@nestjs/common";
import { toErrorBody, type AnyBaseError } from "domain-lib";

export class ApiErrorException extends HttpException {
  constructor(error: AnyBaseError, status: number) {
    super(toErrorBody(error), status);
  }
}
