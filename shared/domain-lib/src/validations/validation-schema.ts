import type { Result } from "../types/index.js";
import { ValidationError } from "./validation-error.js";
/**
 * A validation schema is a function that validates an object of a given type.
 */

export type ValidationSchema<T> = (
  value: unknown
) => Result<T, ValidationError>;

/**
 * A map of field names to field validators.
 */

export type ValidationSchemaMap<T> = {
  [K in keyof T]-?: FieldValidator<T[K]>;
};

export interface SuccessfulValidationResult<T> {
  isValid: true;
  value: T;
}

export interface FailedValidationResult {
  isValid: false;
  error: string;
}

/**
 * A result of validating a field.
 */

export type FieldValidationResult<T> =
  | SuccessfulValidationResult<T>
  | FailedValidationResult;

/**
 * A field validator is a function that validates a field of a given type.
 */
export type FieldValidator<T> = undefined extends T
  ? OptionalFieldValidator<T>
  : StrictFieldValidator<T>;

export type OptionalFieldValidator<T> = (
  value: unknown
) => FieldValidationResult<T | undefined>;

export type StrictFieldValidator<T> = (
  value: unknown
) => FieldValidationResult<T>;

/**
 * Creates a validation schema from a map of field validators.
 */

export function createValidationSchema<T>(
  schema: ValidationSchemaMap<T>
): ValidationSchema<T> {
  return (value: unknown): Result<T, ValidationError> => {
    const errors: Record<string, string> = {};
    const result: T = {} as T;

    for (const key in schema) {
      const validationResult = schema[key]((value as any)[key]);
      if (!validationResult.isValid) {
        errors[key] = validationResult.error;
      } else {
        result[key] = validationResult.value as any;
      }
    }

    if (Object.keys(errors).length > 0) {
      return new ValidationError(errors, result);
    }

    return result;
  };
}
