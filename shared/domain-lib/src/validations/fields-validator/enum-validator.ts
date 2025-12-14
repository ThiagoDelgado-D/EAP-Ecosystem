import { sanitizeString } from "../../utils";
import type { StrictFieldValidator } from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export interface EnumValidatorOptions extends ValidatorOptions {
  /**
   * Convert string to lowercase before validation
   * @default false
   */
  toLowerCase?: boolean;

  /**
   * Collapse multiple spaces into one
   * @default false
   */
  collapseSpaces?: boolean;
}

export function enumValidator<T extends string>(
  allowedValues: readonly T[],
  fieldName: string = "Enum",
  opts: EnumValidatorOptions = {}
): StrictFieldValidator<T | undefined> {
  const isRequired = opts.required ?? true;

  return (value: unknown) => {
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

    if (typeof value !== "string") {
      return {
        isValid: false,
        error: `${fieldName} must be a string`,
      };
    }

    const trimmed = value.trim();
    if (trimmed === "") {
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

    const sanitized = sanitizeString(value, opts) as T;
    if (!allowedValues.includes(sanitized)) {
      return {
        isValid: false,
        error: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
      };
    }

    return { isValid: true, value: sanitized };
  };
}
