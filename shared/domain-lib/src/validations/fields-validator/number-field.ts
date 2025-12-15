import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export interface NumberFieldOptions extends ValidatorOptions {
  /**
   * Minimum value (inclusive)
   */
  min?: number;

  /**
   * Maximum value (inclusive)
   */
  max?: number;

  /**
   * Whether the number must be an integer
   * @default false
   */
  integer?: boolean;

  /**
   * Whether the number must be positive (> 0)
   * @default false
   */
  positive?: boolean;

  /**
   * Whether the number must be non-negative (>= 0)
   * @default false
   */
  nonNegative?: boolean;

  /**
   * Transform function to apply to the number after validation
   */
  transform?: (value: number) => number;
}

export function numberField(
  fieldName: string = "Number",
  options: NumberFieldOptions = {}
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
