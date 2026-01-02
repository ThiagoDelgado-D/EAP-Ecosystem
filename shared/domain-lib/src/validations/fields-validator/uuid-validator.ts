import type {
  FieldValidationResult,
  FieldValidator,
  StrictFieldValidator,
} from "../validation-schema";
import type { UUID } from "../../types/uuid";
import type { ValidatorOptions } from "./validator-options";

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

export function optionalUUID(
  fieldName: string = "UUID",
  options: Omit<UUIDFieldOptions, "required"> = {}
): FieldValidator<UUID | undefined> {
  return uuidField(fieldName, { ...options, required: false });
}
