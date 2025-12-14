import type { StrictFieldValidator } from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export const requiredDate = (
  fieldName: string = "Date",
  options: ValidatorOptions = { required: true }
): StrictFieldValidator<Date | undefined> => {
  const isRequired = options.required ?? true;

  return (value) => {
    if (value === undefined || value === null) {
      if (isRequired) {
        return {
          isValid: false,
          error: `${fieldName} is required`,
        };
      }
      return { isValid: true, value: undefined };
    }

    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return {
        isValid: false,
        error: `${fieldName} must be a valid date`,
      };
    }

    return { isValid: true, value };
  };
};

export const optionalDate = (fieldName: string = "Date") => {
  return requiredDate(fieldName, { required: false });
};
