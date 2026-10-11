import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response } from "express";
import { toErrorBody, UnauthorizedError, UnexpectedError } from "domain-lib";
import { ApiErrorException } from "../errors/api-error-exception.js";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiErrorException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    if (exception instanceof UnauthorizedException) {
      response.status(exception.getStatus()).json(toErrorBody(new UnauthorizedError()));
      return;
    }
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(toErrorBody(new UnexpectedError()));
      return;
    }
    console.error("Unexpected error:", exception);
    response.status(500).json(toErrorBody(new UnexpectedError()));
  }
}
