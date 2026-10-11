import { HttpStatus } from "@nestjs/common";
import type { ValidationError as ClassValidatorError } from "class-validator";
import { ValidationError } from "domain-lib";
import { ApiErrorException } from "./api-error-exception.js";

const collectFieldMessages = (
  errors: ClassValidatorError[],
  fields: Record<string, string>,
  parentPath?: string,
): Record<string, string> => {
  for (const error of errors) {
    let path = error.property;
    if (parentPath) path = `${parentPath}.${error.property}`;

    const [message] = Object.values(error.constraints ?? {});
    if (message) fields[path] = message;

    collectFieldMessages(error.children ?? [], fields, path);
  }
  return fields;
};

export const toValidationException = (errors: ClassValidatorError[]): ApiErrorException =>
  new ApiErrorException(
    new ValidationError(collectFieldMessages(errors, {})),
    HttpStatus.BAD_REQUEST,
  );
