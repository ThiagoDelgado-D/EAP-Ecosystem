import type {
  FieldValidationResult,
  OptionalFieldValidator,
  StrictFieldValidator,
} from "../validation-schema";

export function requiredString(
  fieldName: string = "Field"
): StrictFieldValidator<string> {
  return (value: unknown): FieldValidationResult<string> => {
    if (typeof value !== "string") {
      return {
        isValid: false,
        error: `${fieldName} must be a string`,
      };
    }

    if (value.trim().length === 0) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
      };
    }

    return {
      isValid: true,
      value: value.trim(),
    };
  };
}

export function optionalString(
  fieldName: string = "Field"
): OptionalFieldValidator<string> {
  return (value: unknown): FieldValidationResult<string | undefined> => {
    if (value === undefined || value === null) {
      return {
        isValid: true,
        value: undefined,
      };
    }

    if (typeof value !== "string") {
      return {
        isValid: false,
        error: `${fieldName} must be a string`,
      };
    }

    const trimmed = value.trim();
    return {
      isValid: true,
      value: trimmed.length > 0 ? trimmed : undefined,
    };
  };
}

export function stringWithMaxLength(
  maxLength: number,
  fieldName: string = "Field"
): StrictFieldValidator<string> {
  return (value: unknown): FieldValidationResult<string> => {
    const baseValidation = requiredString(fieldName)(value);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    if (baseValidation.value.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be less than ${maxLength} characters`,
      };
    }

    return baseValidation;
  };
}

export function urlString(
  fieldName: string = "URL"
): OptionalFieldValidator<string> {
  return (value: unknown): FieldValidationResult<string | undefined> => {
    if (value === undefined || value === null) {
      return {
        isValid: true,
        value: undefined,
      };
    }

    if (typeof value !== "string") {
      return {
        isValid: false,
        error: `${fieldName} must be a string`,
      };
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return {
        isValid: true,
        value: undefined,
      };
    }

    try {
      new URL(trimmed);
      return {
        isValid: true,
        value: trimmed,
      };
    } catch {
      return {
        isValid: false,
        error: "Invalid URL format",
      };
    }
  };
}
