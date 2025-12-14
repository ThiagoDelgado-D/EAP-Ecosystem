import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export function nonEmptyArray<T>(
  fieldName: string = "Array",
  options: ValidatorOptions = { required: true }
): StrictFieldValidator<T[] | undefined> {
  const isRequired = options.required ?? true;

  return (value: unknown): FieldValidationResult<T[] | undefined> => {
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

    if (!Array.isArray(value)) {
      return {
        isValid: false,
        error: `${fieldName} must be an array`,
      };
    }

    if (value.length === 0) {
      return {
        isValid: false,
        error: `${fieldName} must contain at least one item`,
      };
    }

    return {
      isValid: true,
      value,
    };
  };
}
