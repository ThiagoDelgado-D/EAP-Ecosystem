import { sanitizeString } from "../../utils";
import type { StrictFieldValidator } from "../validation-schema";

export function enumValidator<T extends string>(
  allowedValues: readonly T[],
  fieldName: string = "Enum",
  opts: { toLowerCase?: boolean; collapseSpaces?: boolean } = {}
): StrictFieldValidator<T> {
  return (value: unknown) => {
    if (typeof value !== "string") {
      return { isValid: false, error: `${fieldName} must be a string` };
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
