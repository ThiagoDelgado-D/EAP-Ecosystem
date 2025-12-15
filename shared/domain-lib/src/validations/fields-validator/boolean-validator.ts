import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";

export function requiredBoolean(
  fieldName: string = "Field"
): StrictFieldValidator<boolean> {
  return (value: unknown): FieldValidationResult<boolean> => {
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
