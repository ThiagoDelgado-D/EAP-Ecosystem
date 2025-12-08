import type {
  FieldValidationResult,
  StrictFieldValidator,
} from "../validation-schema";
import type { UUID } from "../../types/uuid";

export function requiredUUID(
  fieldName: string = "ID"
): StrictFieldValidator<UUID> {
  return (value: unknown): FieldValidationResult<UUID> => {
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
      value: value as UUID,
    };
  };
}
