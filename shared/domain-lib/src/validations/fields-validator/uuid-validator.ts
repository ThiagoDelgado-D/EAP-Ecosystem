import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema.js";
import type { UUID } from "../../types/uuid.js";
import type { ValidatorOptions } from "./validator-options.js";

export interface UUIDFieldOptions extends ValidatorOptions {}

export function uuidField(): FieldValidator<UUID>;
export function uuidField(
  fieldName: string,
  options: { required: true } & UUIDFieldOptions
): FieldValidator<UUID>;
export function uuidField(
  fieldName: string,
  options?: { required?: false } & UUIDFieldOptions
): FieldValidator<UUID | undefined>;

/**
 * Creates a field validator that validates and normalizes UUID strings.
 *
 * The validator accepts undefined/null or empty strings as valid only when `options.required` is `false`; otherwise it returns a required-field error. When valid, the validator returns the trimmed UUID in lowercase.
 *
 * @param fieldName - Name used in default error messages (default: `"UUID"`).
 * @param options - Validation options. Recognized properties:
 *   - `required` (default: `true`) — whether the field must be present and non-empty.
 *   - `requiredMessage` — message returned when a required value is missing or empty (defaults to `${fieldName} is required`).
 *   - `typeMessage` — message returned when the value is not a valid UUID string (defaults to `${fieldName} must be a valid UUID`).
 * @returns The validation result: `isValid: true` with `value` set to the trimmed, lowercased UUID (or `undefined` when not required and missing), or `isValid: false` with `error` describing the failure.
 */
export function uuidField(
  fieldName: string = "UUID",
  options: UUIDFieldOptions = {}
): FieldValidator<UUID | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a valid UUID`,
  } = options;

  return (value: unknown): FieldValidationResult<UUID | undefined> => {
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

    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedValue)) {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    return {
      isValid: true,
      value: trimmedValue.toLowerCase() as UUID,
    };
  };
}

export function optionalUUID(): FieldValidator<UUID | undefined>;
export function optionalUUID(
  fieldName: string,
  options?: Omit<UUIDFieldOptions, "required">
): FieldValidator<UUID | undefined>;

/**
 * Creates a validator for an optional UUID field.
 *
 * @param fieldName - Field label used in error messages (defaults to `"UUID"`).
 * @param options - Validation options (UUIDFieldOptions) excluding `required`; used to customize messages and other validation behavior.
 * @returns A FieldValidator that accepts a UUID string or `undefined`. When valid, the validator returns the trimmed, lowercased UUID; when absent and not required, it returns `undefined`.
 */
export function optionalUUID(
  fieldName: string = "UUID",
  options: Omit<UUIDFieldOptions, "required"> = {}
): FieldValidator<UUID | undefined> {
  return uuidField(fieldName, { ...options, required: false });
}
