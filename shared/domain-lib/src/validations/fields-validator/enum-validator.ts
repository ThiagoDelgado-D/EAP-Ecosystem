import { sanitizeString } from "../../utils";
import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

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

export function optionalEnum<T extends string>(
  allowedValues: readonly T[],
  fieldName: string = "Enum",
  options: Omit<EnumFieldOptions<T>, "required"> = {}
): FieldValidator<T | undefined> {
  return enumField(allowedValues, fieldName, { ...options, required: false });
}
