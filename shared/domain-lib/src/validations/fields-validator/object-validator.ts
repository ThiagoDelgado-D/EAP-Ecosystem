import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";

export function objectField<T extends Record<string, unknown>>(
  fieldName: string = "Object",
  validators?: { [K in keyof T]?: StrictFieldValidator<T[K]> }
): StrictFieldValidator<T> {
  return (value: unknown): FieldValidationResult<T> => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {
        isValid: false,
        error: `${fieldName} must be an object`,
      };
    }

    if (validators) {
      for (const key in validators) {
        const validate = validators[key];
        if (validate) {
          const result = validate((value as T)[key]);
          if (!result.isValid) {
            return {
              isValid: false,
              error: `${fieldName}.${key}: ${result.error}`,
            };
          }
        }
      }
    }

    return {
      isValid: true,
      value: value as T,
    };
  };
}
