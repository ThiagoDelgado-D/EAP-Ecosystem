import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";

export function nonEmptyArray<T>(
  fieldName: string = "Array"
): StrictFieldValidator<T[]> {
  return (value: unknown): FieldValidationResult<T[]> => {
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
