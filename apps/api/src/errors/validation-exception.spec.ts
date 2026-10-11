import { HttpStatus } from "@nestjs/common";
import type { ValidationError as ClassValidatorError } from "class-validator";
import { ValidationError } from "domain-lib";
import { toValidationException } from "./validation-exception.js";

const MISSING_TITLE_MESSAGE = "title should not be empty";
const TITLE_TOO_SHORT_MESSAGE = "title must be longer than or equal to 3 characters";
const UNKNOWN_TARGET_KIND_MESSAGE = "kind must be one of the following values: free, resource, node";

const validationErrorOn = (
  property: string,
  constraints: Record<string, string>,
  children: ClassValidatorError[] = [],
): ClassValidatorError => ({ property, constraints, children });

describe("toValidationException", () => {
  test("Should answer 400 with VALIDATION_ERROR", () => {
    const exception = toValidationException([
      validationErrorOn("title", { isNotEmpty: MISSING_TITLE_MESSAGE }),
    ]);

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.getResponse()).toEqual({
      error: new ValidationError({}).name,
      fields: { title: MISSING_TITLE_MESSAGE },
    });
  });

  test("Should keep only the first message of each field", () => {
    const exception = toValidationException([
      validationErrorOn("title", {
        isNotEmpty: MISSING_TITLE_MESSAGE,
        minLength: TITLE_TOO_SHORT_MESSAGE,
      }),
    ]);

    expect(exception.getResponse()).toEqual({
      error: new ValidationError({}).name,
      fields: { title: MISSING_TITLE_MESSAGE },
    });
  });

  test("Should name nested fields by their path", () => {
    const exception = toValidationException([
      validationErrorOn("target", {}, [
        validationErrorOn("kind", { isIn: UNKNOWN_TARGET_KIND_MESSAGE }),
      ]),
    ]);

    expect(exception.getResponse()).toEqual({
      error: new ValidationError({}).name,
      fields: { "target.kind": UNKNOWN_TARGET_KIND_MESSAGE },
    });
  });
});
