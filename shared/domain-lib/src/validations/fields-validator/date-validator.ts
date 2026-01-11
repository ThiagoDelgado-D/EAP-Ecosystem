import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export interface DateFieldOptions extends ValidatorOptions {
  /**
   * Minimum date (inclusive)
   */
  min?: Date;

  /**
   * Maximum date (inclusive)
   */
  max?: Date;

  /**
   * Whether to parse string values into dates
   * @default false
   */
  parseString?: boolean;

  /**
   * Transform function to apply to the date after validation
   */
  transform?: (value: Date) => Date;
}

export function dateField(): FieldValidator<Date>;
export function dateField(
  fieldName: string,
  options: { required: true } & DateFieldOptions
): FieldValidator<Date>;
export function dateField(
  fieldName: string,
  options?: { required?: false } & DateFieldOptions
): FieldValidator<Date | undefined>;

export function dateField(
  fieldName: string = "Date",
  options: DateFieldOptions = {}
): FieldValidator<Date | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a valid date`,
    min,
    max,
    parseString = false,
    transform,
  } = options;

  return (value: unknown): FieldValidationResult<Date | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    let dateValue: Date;

    if (parseString && typeof value === "string") {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        return {
          isValid: false,
          error: typeMessage,
        };
      }
      dateValue = parsed;
    } else if (!(value instanceof Date)) {
      return {
        isValid: false,
        error: typeMessage,
      };
    } else {
      dateValue = value;
    }

    if (isNaN(dateValue.getTime())) {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    if (min && dateValue < min) {
      return {
        isValid: false,
        error: `${fieldName} must be on or after ${min.toISOString()}`,
      };
    }

    if (max && dateValue > max) {
      return {
        isValid: false,
        error: `${fieldName} must be on or before ${max.toISOString()}`,
      };
    }

    if (transform) {
      dateValue = transform(dateValue);
    }

    return {
      isValid: true,
      value: dateValue,
    };
  };
}

export function optionalDate(): FieldValidator<Date | undefined>;
export function optionalDate(
  fieldName: string,
  options?: Omit<DateFieldOptions, "required">
): FieldValidator<Date | undefined>;

export function optionalDate(
  fieldName: string = "Date",
  options: Omit<DateFieldOptions, "required"> = {}
): FieldValidator<Date | undefined> {
  return dateField(fieldName, { ...options, required: false });
}
