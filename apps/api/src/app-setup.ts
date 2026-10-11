import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { GlobalExceptionFilter } from "./filters/http-exception-filter.js";
import { toValidationException } from "./errors/validation-exception.js";

export const configureRequestHandling = (app: INestApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: toValidationException,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
};
