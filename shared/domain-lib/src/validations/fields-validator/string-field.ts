import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export interface StringFieldOptions extends ValidatorOptions {
  /**
   * Minimum length of the string
   */
  minLength?: number;

  /**
   * Maximum length of the string
   */
  maxLength?: number;

  /**
   * Regular expression pattern to validate against
   */
  pattern?: {
    regex: RegExp;
    message?: string;
  };

  /**
   * Whether to trim the string
   * @default true
   */
  trim?: boolean;

  /**
   * Whether to allow empty strings when required is true
   * @default false
   */
  allowEmpty?: boolean;

  /**
   * Transform function to apply to the string after validation
   */
  transform?: (value: string) => string;
}

export function stringField(): FieldValidator<string>;
export function stringField(
  fieldName: string,
  options: { required: true } & StringFieldOptions
): FieldValidator<string>;

export function stringField(
  fieldName: string,
  options?: { required?: boolean } & StringFieldOptions
): FieldValidator<string | undefined>;

/**
 * Creates a configurable validator for string fields that enforces presence, length, pattern, trimming, and optional transformation.
 *
 * @param fieldName - Field label used in default error messages
 * @param options - Validation options:
 *  - `required` (default `true`): whether the field must be provided
 *  - `requiredMessage`: custom message when a required field is missing or empty
 *  - `typeMessage`: custom message when the value is not a string
 *  - `trim` (default `true`): whether to trim surrounding whitespace before validation
 *  - `allowEmpty` (default `false`): whether an empty string is considered valid when present
 *  - `minLength` / `maxLength`: minimum and maximum allowed string lengths
 *  - `pattern`: `{ regex, message? }` to validate format with optional custom message
 *  - `transform`: function to apply to the processed value before returning
 * @returns A field validator that yields a validation result: when valid, `value` contains the processed (and possibly transformed) string or `undefined` for absent/optional empty values; when invalid, `error` contains a descriptive message and `isValid` is `false`.
 */
export function stringField(
  fieldName: string = "Field",
  options: StringFieldOptions = {}
): FieldValidator<string | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a string`,
    trim = true,
    allowEmpty = false,
    minLength,
    maxLength,
    pattern,
    transform,
  } = options;

  return (value: unknown): FieldValidationResult<string | undefined> => {
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

    let processedValue = trim ? value.trim() : value;
    const isEmpty = processedValue.length === 0;

    if (isEmpty) {
      if (allowEmpty) {
        return { isValid: true, value: processedValue };
      }

      if (required) {
        return { isValid: false, error: requiredMessage };
      }

      return { isValid: true, value: undefined };
    }

    if (minLength !== undefined && processedValue.length < minLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${minLength} characters`,
      };
    }

    if (maxLength !== undefined && processedValue.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at most ${maxLength} characters`,
      };
    }

    if (pattern && !pattern.regex.test(processedValue)) {
      return {
        isValid: false,
        error: pattern.message || `${fieldName} has invalid format`,
      };
    }

    if (transform) {
      processedValue = transform(processedValue);
    }

    return {
      isValid: true,
      value: processedValue,
    };
  };
}

/**
 * Creates a validator for an optional string field using the same validation rules as stringField but with `required` forced to `false`.
 *
 * @param fieldName - Human-readable field name used in error messages (defaults to `"Field"`).
 * @param options - Validation options (all from StringFieldOptions except `required`): `minLength`, `maxLength`, `pattern` (with `regex` and optional `message`), `trim`, `allowEmpty`, and `transform`.
 * @returns A FieldValidator that validates and optionally transforms a string; it yields the processed string when present and valid, or `undefined` when the value is absent or empty per the options.
 */
export function optionalString(
  fieldName: string = "Field",
  options: Omit<StringFieldOptions, "required"> = {}
): FieldValidator<string | undefined> {
  return stringField(fieldName, { ...options, required: false });
}

export function urlField(
  fieldName: string,
  options: { required: true } & StringFieldOptions
): FieldValidator<string>;

export function urlField(
  fieldName: string,
  options?: { required?: false } & StringFieldOptions
): FieldValidator<string | undefined>;

/**
 * Creates a field validator that validates URL strings using the provided options.
 *
 * @param fieldName - Label used in error messages; defaults to `"URL"`.
 * @param options - StringFieldOptions to customize validation behavior (e.g., `required`, `minLength`, `maxLength`, `trim`, `allowEmpty`, `transform`).
 * @returns A `FieldValidator<string | undefined>` that validates the value as a URL, applies the provided string options, and returns the processed string when valid or `undefined` for absent/optional values.
 */
export function urlField(
  fieldName: string = "URL",
  options: StringFieldOptions = {}
): FieldValidator<string | undefined> {
  const urlPattern = {
    regex: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    message: `${fieldName} must be a valid URL`,
  };

  return stringField(fieldName, {
    ...options,
    pattern: urlPattern,
  });
}

export function emailField(
  fieldName: string,
  options: { required: true } & StringFieldOptions
): FieldValidator<string>;

export function emailField(
  fieldName: string,
  options?: { required?: boolean } & StringFieldOptions
): FieldValidator<string | undefined>;

/**
 * Creates a string field validator that enforces email format and lowercases the value.
 *
 * @param fieldName - Name used in validation messages (defaults to "Email")
 * @param options - Validation options forwarded to the underlying string validator (e.g., `required`, `minLength`, `maxLength`, `pattern`, `trim`, `allowEmpty`, `transform`)
 * @returns A FieldValidator that validates the value as an email and returns the validated email lowercased, or `undefined` when the field is optional and absent
 */
export function emailField(
  fieldName: string = "Email",
  options: StringFieldOptions = {}
): FieldValidator<string | undefined> {
  const emailPattern = {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: `${fieldName} must be a valid email address`,
  };

  return stringField(fieldName, {
    ...options,
    pattern: emailPattern,
    transform: (value: string) => value.toLowerCase(),
    required: options.required,
  });
}