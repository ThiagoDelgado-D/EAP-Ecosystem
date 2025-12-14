import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export function positiveNumber(
  fieldName: string = "Number",
  options: ValidatorOptions = { required: true }
): StrictFieldValidator<number | undefined> {
  const isRequired = options.required ?? true;

  return (value: unknown): FieldValidationResult<number | undefined> => {
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
  fieldName: string = "Number",
  options: ValidatorOptions = { required: true }
): StrictFieldValidator<number | undefined> {
  const isRequired = options.required ?? true;

  return (value: unknown): FieldValidationResult<number | undefined> => {
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
