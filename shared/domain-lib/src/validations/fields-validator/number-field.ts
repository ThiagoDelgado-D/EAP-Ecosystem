import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";

export function positiveNumber(
  fieldName: string = "Number"
): StrictFieldValidator<number> {
  return (value: unknown): FieldValidationResult<number> => {
    if (typeof value !== "number") {
      return {
        isValid: false,
        error: `${fieldName} must be a number`,
      };
    }

    if (value <= 0) {
      return {
        isValid: false,
        error: `${fieldName} must be greater than 0`,
      };
    }

    return {
      isValid: true,
      value,
    };
  };
}

export function numberInRange(
  min: number,
  max: number,
  fieldName: string = "Number"
): StrictFieldValidator<number> {
  return (value: unknown): FieldValidationResult<number> => {
    if (typeof value !== "number") {
      return {
        isValid: false,
        error: `${fieldName} must be a number`,
      };
    }

    if (value < min || value > max) {
      return {
        isValid: false,
        error: `${fieldName} must be between ${min} and ${max}`,
      };
    }

    return {
      isValid: true,
      value,
    };
  };
}
