import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export function requiredBoolean(
  fieldName: string = "Field",
  options: ValidatorOptions = { required: true }
): StrictFieldValidator<boolean | undefined> {
  const isRequired = options.required ?? true;

  return (value: unknown): FieldValidationResult<boolean | undefined> => {
    if (value === undefined || value === null) {
      if (isRequired) {
        return {
          isValid: false,
          error: `${fieldName} is required`,
        };
      }
      return {
        isValid: true,
        value: undefined,
      };
    }

    if (typeof value !== "boolean") {
      return {
        isValid: false,
        error: `${fieldName} must be a boolean`,
      };
    }

    return {
      isValid: true,
      value,
    };
  };
}

export function optionalBoolean(fieldName: string = "Field") {
  return requiredBoolean(fieldName, { required: false });
}
