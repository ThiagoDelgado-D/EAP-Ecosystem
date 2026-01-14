import { sanitizeString } from "../../utils/index.js";
import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema.js";
import type { ValidatorOptions } from "./validator-options.js";

export interface EnumFieldOptions<T extends string> extends ValidatorOptions {
  /**
   * Convert value to lowercase before validation
   * @default false
   */
  toLowerCase?: boolean;

  /**
   * Collapse multiple consecutive spaces into a single space
   * @default false
   */
  collapseSpaces?: boolean;

  /**
   * Transform the value after validation
   */
  transform?: (value: T) => T;

  /**
   * Custom error message for invalid enum values
   */
  invalidValueMessage?: string;
}

export function enumField<T extends string>(
  allowedValues: readonly T[]
): FieldValidator<T>;
export function enumField<T extends string>(
  allowedValues: readonly T[],
  fieldName: string,
  options: { required: true } & EnumFieldOptions<T>
): FieldValidator<T>;
export function enumField<T extends string>(
  allowedValues: readonly T[],
  fieldName: string,
  options?: { required?: false } & EnumFieldOptions<T>
): FieldValidator<T | undefined>;

/**
 * Creates a field validator that ensures a string value is one of the provided allowed enum values.
 *
 * The returned validator normalizes the input using `sanitizeString` (respecting `toLowerCase` and
 * `collapseSpaces`), enforces required/optional behavior, validates membership in `allowedValues`,
 * and applies an optional `transform` to the validated value.
 *
 * @param allowedValues - Array of permitted string values for the field.
 * @param fieldName - Human-readable field name used to build default error messages.
 * @param options - Configuration for validation and normalization:
 *  - `required` (default `true`) — whether the field must be present and non-empty.
 *  - `requiredMessage` — custom message when a required value is missing or empty.
 *  - `typeMessage` — custom message when the input is not a string.
 *  - `invalidValueMessage` — custom message when the value is not one of `allowedValues`.
 *  - `toLowerCase` (default `false`) — convert the value to lowercase before validation.
 *  - `collapseSpaces` (default `false`) — collapse consecutive spaces into one before validation.
 *  - `transform` — optional post-validation function to map the validated value to a final value.
 * @returns A `FieldValidationResult<T | undefined>` containing:
 *  - `isValid`: `true` when validation succeeds, `false` otherwise.
 *  - `value`: the validated (and optionally transformed) value, or `undefined` when the field is optional/empty.
 *  - `error`: an error message when `isValid` is `false`.
 */
export function enumField<T extends string>(
  allowedValues: readonly T[],
  fieldName: string = "Enum",
  options: EnumFieldOptions<T> = {}
): FieldValidator<T | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a string`,
    invalidValueMessage = `${fieldName} must be one of: ${allowedValues.join(
      ", "
    )}`,
    toLowerCase = false,
    collapseSpaces = false,
    transform,
  } = options;

  return (value: unknown): FieldValidationResult<T | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    if (typeof value !== "string") {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    let sanitized = sanitizeString(value, { toLowerCase, collapseSpaces }) as T;

    if (!required && sanitized.length === 0) {
      return { isValid: true, value: undefined };
    }

    if (required && sanitized.length === 0) {
      return {
        isValid: false,
        error: requiredMessage,
      };
    }

    if (!allowedValues.includes(sanitized)) {
      return {
        isValid: false,
        error: invalidValueMessage,
      };
    }

    if (transform) {
      sanitized = transform(sanitized);
    }

    return {
      isValid: true,
      value: sanitized,
    };
  };
}

export function optionalEnum<T extends string>(
  allowedValues: readonly T[]
): FieldValidator<T | undefined>;
export function optionalEnum<T extends string>(
  allowedValues: readonly T[],
  fieldName: string,
  options?: Omit<EnumFieldOptions<T>, "required">
): FieldValidator<T | undefined>;

/**
 * Creates a field validator that validates an optional string against a set of allowed enum values.
 *
 * @param allowedValues - Array of permitted string values for the enum
 * @param fieldName - Human-readable field name used in default error messages
 * @param options - Validation options (normalization, custom messages, transform); `required` is forced to `false`
 * @returns A validation result containing the validated enum value of type `T` when present and valid, or `undefined` when absent; on validation failure the result contains an error message
 */
export function optionalEnum<T extends string>(
  allowedValues: readonly T[],
  fieldName: string = "Enum",
  options: Omit<EnumFieldOptions<T>, "required"> = {}
): FieldValidator<T | undefined> {
  return enumField(allowedValues, fieldName, { ...options, required: false });
}
