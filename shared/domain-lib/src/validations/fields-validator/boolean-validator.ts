import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema.js";
import type { ValidatorOptions } from "./validator-options.js";

export function booleanField(): FieldValidator<boolean>;
export function booleanField(
  fieldName: string,
  options: { required: true } & ValidatorOptions
): FieldValidator<boolean>;
export function booleanField(
  fieldName: string,
  options?: { required?: false } & ValidatorOptions
): FieldValidator<boolean | undefined>;

/**
 * Creates a field validator that enforces a boolean value and configurable requiredness and error messages.
 *
 * @param fieldName - Label used in default error messages (default: `"Field"`).
 * @param options - Validation options:
 *   - `required` (default: `true`) — whether a missing value is invalid.
 *   - `requiredMessage` (default: `${fieldName} is required`) — message when a required value is missing.
 *   - `typeMessage` (default: `${fieldName} must be a boolean`) — message when the value is not a boolean.
 * @returns The validation result: `isValid: true` with the boolean `value` when valid; `isValid: false` with an `error` message when invalid.
 */
export function booleanField(
  fieldName: string = "Field",
  options: ValidatorOptions = {}
): FieldValidator<boolean | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a boolean`,
  } = options;

  return (value: unknown): FieldValidationResult<boolean | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    if (typeof value !== "boolean") {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    return {
      isValid: true,
      value,
    };
  };
}

export function optionalBoolean(): FieldValidator<boolean | undefined>;
export function optionalBoolean(
  fieldName: string,
  options?: Omit<ValidatorOptions, "required">
): FieldValidator<boolean | undefined>;

/**
 * Creates a boolean field validator that allows missing values.
 *
 * @param fieldName - Human-readable name used in error messages (defaults to `"Field"`).
 * @param options - Additional validator options; the `required` flag is forced to `false`.
 * @returns A FieldValidator that yields the validated boolean value or `undefined`; on failure the result contains an error message.
 */
export function optionalBoolean(
  fieldName: string = "Field",
  options: Omit<ValidatorOptions, "required"> = {}
): FieldValidator<boolean | undefined> {
  return booleanField(fieldName, { ...options, required: false });
}
