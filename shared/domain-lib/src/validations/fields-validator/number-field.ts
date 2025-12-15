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
): StrictFieldValidator<number | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a number`,
    min,
    max,
    integer = false,
    positive = false,
    nonNegative = false,
    transform,
  } = options;

  return (value: unknown): FieldValidationResult<number | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    let processedValue = value;

    if (integer && !Number.isInteger(processedValue)) {
      return {
        isValid: false,
        error: `${fieldName} must be an integer`,
      };
    }

    if (positive && processedValue <= 0) {
      return {
        isValid: false,
        error: `${fieldName} must be greater than 0`,
      };
    }

    if (nonNegative && processedValue < 0) {
      return {
        isValid: false,
        error: `${fieldName} must be greater than or equal to 0`,
      };
    }

    const hasExactValue = min !== undefined && max !== undefined && min === max;
    if (hasExactValue && processedValue !== min) {
      return {
        isValid: false,
        error: `${fieldName} must be exactly ${min}`,
      };
    }

    const hasRange = min !== undefined && max !== undefined && min !== max;
    if (hasRange && (processedValue < min || processedValue > max)) {
      return {
        isValid: false,
        error: `${fieldName} must be between ${min} and ${max}`,
      };
    }

    const shouldValidateMin = min !== undefined && !hasExactValue && !hasRange;
    if (shouldValidateMin && processedValue < min) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${min}`,
      };
    }

    const shouldValidateMax = max !== undefined && !hasExactValue && !hasRange;
    if (shouldValidateMax && processedValue > max) {
      return {
        isValid: false,
        error: `${fieldName} must be at most ${max}`,
      };
    }

    if (transform) {
      processedValue = transform(processedValue);
    }

    return {
      isValid: true,
      value: processedValue,
    };
  };
}

export function optionalNumber(
  fieldName: string = "Number",
  options: Omit<NumberFieldOptions, "required"> = {}
): StrictFieldValidator<number | undefined> {
  return numberField(fieldName, { ...options, required: false });
}

export function positiveNumber(
  fieldName: string = "Number",
  options: Omit<NumberFieldOptions, "positive"> = {}
): StrictFieldValidator<number | undefined> {
  return numberField(fieldName, { ...options, positive: true });
}

export function numberInRange(
  min: number,
  max: number,
  fieldName: string = "Number",
  options: Omit<NumberFieldOptions, "min" | "max"> = {}
): StrictFieldValidator<number | undefined> {
  return numberField(fieldName, { ...options, min, max });
}
