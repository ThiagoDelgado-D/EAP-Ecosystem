import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";

export interface StringFieldOptions {
  /**
   * Whether the field is required
   * @default true
   */
  required?: boolean;

  /**
   * Custom error message when field is required but missing
   */
  requiredMessage?: string;

  /**
   * Minimum length of the string
   */
  minLength?: number;

  /**
   * Maximum length of the string
   */
  maxLength?: number;

  /**
   * Regular expression pattern to validate against
   */
  pattern?: {
    regex: RegExp;
    message?: string;
  };

  /**
   * Custom error message when type is invalid
   */
  typeMessage?: string;

  /**
   * Whether to trim the string
   * @default true
   */
  trim?: boolean;

  /**
   * Whether to allow empty strings when required is true
   * @default false
   */
  allowEmpty?: boolean;

  /**
   * Transform function to apply to the string after validation
   */
  transform?: (value: string) => string;
}

/**
 * Creates a string field validator with configurable options
 */
export function stringField(
  fieldName: string = "Field",
  options: StringFieldOptions = {}
): StrictFieldValidator<string | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be a string`,
    trim = true,
    allowEmpty = false,
    minLength,
    maxLength,
    pattern,
    transform,
  } = options;

  return (value: unknown): FieldValidationResult<string | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    if (typeof value !== "string") {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    let processedValue = trim ? value.trim() : value;
    const isEmpty = processedValue.length === 0;

    if (isEmpty) {
      if (allowEmpty) {
        return { isValid: true, value: processedValue };
      }

      if (required) {
        return { isValid: false, error: requiredMessage };
      }

      return { isValid: true, value: undefined };
    }

    if (minLength !== undefined && processedValue.length < minLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${minLength} characters`,
      };
    }

    if (maxLength !== undefined && processedValue.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at most ${maxLength} characters`,
      };
    }

    if (pattern && !pattern.regex.test(processedValue)) {
      return {
        isValid: false,
        error: pattern.message || `${fieldName} has invalid format`,
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

export function optionalString(
  fieldName: string = "Field",
  options: Omit<StringFieldOptions, "required"> = {}
): StrictFieldValidator<string | undefined> {
  return stringField(fieldName, { ...options, required: false });
}

export function urlField(
  fieldName: string = "URL",
  options: StringFieldOptions = {}
): StrictFieldValidator<string | undefined> {
  const urlPattern = {
    regex: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    message: `${fieldName} must be a valid URL`,
  };

  return stringField(fieldName, {
    ...options,
    pattern: urlPattern,
    required: options.required ?? true,
  });
}

export function emailField(
  fieldName: string = "Email",
  options: StringFieldOptions = {}
): StrictFieldValidator<string | undefined> {
  const emailPattern = {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: `${fieldName} must be a valid email address`,
  };

  return stringField(fieldName, {
    ...options,
    pattern: emailPattern,
    transform: (value: string) => value.toLowerCase(),
  });
}
