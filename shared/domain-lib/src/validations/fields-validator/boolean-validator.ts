import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export function booleanField(): FieldValidator<boolean>;
export function booleanField(
  fieldName: string,
  options: { required: true } & ValidatorOptions
): FieldValidator<boolean>;
export function booleanField(
  fieldName: string,
  options?: { required?: false } & ValidatorOptions
): FieldValidator<boolean | undefined>;

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

export function optionalBoolean(
  fieldName: string = "Field",
  options: Omit<ValidatorOptions, "required"> = {}
): FieldValidator<boolean | undefined> {
  return booleanField(fieldName, { ...options, required: false });
}
