import type { StrictFieldValidator } from "../validation-schema";

export const requiredDate = (
  fieldName: string = "Date"
): StrictFieldValidator<Date> => {
  return (value) => {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return {
        isValid: false,
        error: `${fieldName} must be a valid date`,
      };
    }

    return { isValid: true, value };
  };
};

export const optionalDate = (
  fieldName: string = "Date"
): StrictFieldValidator<Date | undefined> => {
  return (value) => {
    if (value === undefined || value === null) {
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
