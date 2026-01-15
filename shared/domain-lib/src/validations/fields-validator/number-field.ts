import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema.js";
import type { ValidatorOptions } from "./validator-options.js";

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

export function numberField(): FieldValidator<number>;
export function numberField(
  fieldName: string,
  options: { required: true } & NumberFieldOptions
): FieldValidator<number>;
export function numberField(
  fieldName: string,
  options?: { required?: false } & NumberFieldOptions
): FieldValidator<number | undefined>;
/**
 * Produces a validator for numeric fields with configurable constraints and messages.
 *
 * @param fieldName - Human-readable name used in error messages (defaults to `"Number"`).
 * @param options - Validation options:
 *   - required: whether the field is required
 *   - requiredMessage: custom message when required value is missing
 *   - typeMessage: custom message when value is not a finite number
 *   - min / max: inclusive bounds (when both equal, value must match exactly)
 *   - integer: require an integer value
 *   - positive: require a value greater than 0
 *   - nonNegative: require a value greater than or equal to 0
 *   - transform: function to apply to the validated number before returning
 * @returns A FieldValidationResult containing the validated number (possibly transformed) when valid, or an error message when invalid; when the field is optional and missing, returns a valid result with `value` set to `undefined`.
 */
export function numberField(
  fieldName: string = "Number",
  options: NumberFieldOptions = {}
): FieldValidator<number | undefined> {
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

export function optionalNumber(): FieldValidator<number | undefined>;
export function optionalNumber(
  fieldName: string,
  options?: Omit<NumberFieldOptions, "required">
): FieldValidator<number | undefined>;

/**
 * Creates a validator for an optional numeric field.
 *
 * @param fieldName - Human-readable field name used in error messages (defaults to "Number")
 * @param options - Number validation options (min, max, integer, positive, nonNegative, transform, etc.); `required` is always false
 * @returns A FieldValidator that validates a numeric value and returns the validated (and possibly transformed) number, or `undefined` when the value is absent
 */
export function optionalNumber(
  fieldName: string = "Number",
  options: Omit<NumberFieldOptions, "required"> = {}
): FieldValidator<number | undefined> {
  return numberField(fieldName, { ...options, required: false });
}

export function positiveNumber(): FieldValidator<number>;
export function positiveNumber(
  fieldName: string,
  options: Omit<NumberFieldOptions, "positive">
): FieldValidator<number>;
export function positiveNumber(
  fieldName: string,
  options?: { required?: false } & Omit<NumberFieldOptions, "positive">
): FieldValidator<number | undefined>;

/**
 * Creates a validator that requires a number strictly greater than 0.
 *
 * @param fieldName - Human-readable field name used in error messages (default: "Number")
 * @param options - Additional numeric validation options: min, max, integer, nonNegative, and transform
 * @returns A field validator that validates and (optionally) transforms a positive number, or returns `undefined` when the field is optional and missing
 */
export function positiveNumber(
  fieldName: string = "Number",
  options: Omit<NumberFieldOptions, "positive" | "required"> = {}
): FieldValidator<number | undefined> {
  return numberField(fieldName, { ...options, positive: true });
}

export function numberInRange(min: number, max: number): FieldValidator<number>;
export function numberInRange(
  min: number,
  max: number,
  fieldName: string,
  options: { required: true } & Omit<NumberFieldOptions, "min" | "max">
): FieldValidator<number>;
export function numberInRange(
  min: number,
  max: number,
  fieldName: string,
  options?: { required?: false } & Omit<NumberFieldOptions, "min" | "max">
): FieldValidator<number | undefined>;

/**
 * Creates a number field validator that requires the value to be within the inclusive [min, max] range.
 *
 * @param min - The inclusive lower bound for the allowed value
 * @param max - The inclusive upper bound for the allowed value
 * @param fieldName - Human-readable field name used in error messages
 * @param options - Additional number validation options (e.g., `integer`, `positive`, `nonNegative`, `transform`); `min`, `max`, and `required` are not accepted here
 * @returns A FieldValidator that validates numbers in the inclusive range `[min, max]` and returns the validated (possibly transformed) number, or `undefined` when the validator is configured as optional
 */
export function numberInRange(
  min: number,
  max: number,
  fieldName: string = "Number",
  options: Omit<NumberFieldOptions, "min" | "max" | "required"> = {}
): FieldValidator<number | undefined> {
  return numberField(fieldName, { ...options, min, max });
}
