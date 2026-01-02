import type {
  FieldValidationResult,
  FieldValidator,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export interface ArrayFieldOptions<T = any> extends ValidatorOptions {
  minLength?: number;

  maxLength?: number;

  itemValidator?: (item: unknown, index: number) => FieldValidationResult<T>;

  transform?: (value: T[]) => T[];
}

export function arrayField<T>(): FieldValidator<T[]>;
export function arrayField<T>(
  fieldName: string,
  options: { required: true } & ArrayFieldOptions<T>
): FieldValidator<T[]>;
export function arrayField<T>(
  fieldName: string,
  options?: { required?: false } & ArrayFieldOptions<T>
): FieldValidator<T[] | undefined>;

export function arrayField<T>(
  fieldName: string = "Array",
  options: ArrayFieldOptions<T> = {}
): FieldValidator<T[] | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be an array`,
    minLength,
    maxLength,
    itemValidator,
    transform,
  } = options;

  return (value: unknown): FieldValidationResult<T[] | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return {
          isValid: false,
          error: requiredMessage,
        };
      }
      return { isValid: true, value: undefined };
    }

    if (!Array.isArray(value)) {
      return {
        isValid: false,
        error: typeMessage,
      };
    }

    if (!required && value.length === 0) {
      return { isValid: true, value: undefined };
    }

    if (minLength !== undefined && value.length < minLength) {
      return {
        isValid: false,
        error: `${fieldName} must contain at least ${minLength} item${
          minLength === 1 ? "" : "s"
        }`,
      };
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must contain at most ${maxLength} item${
          maxLength === 1 ? "" : "s"
        }`,
      };
    }

    if (itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = itemValidator(value[i], i);
        if (!itemResult.isValid) {
          return {
            isValid: false,
            error: `${fieldName}[${i}]: ${itemResult.error}`,
          };
        }
      }
    }

    let resultArray: T[] = value;

    if (transform) {
      resultArray = transform(resultArray);
    }

    return {
      isValid: true,
      value: resultArray,
    };
  };
}

export function optionalArray<T>(): FieldValidator<T[] | undefined>;
export function optionalArray<T>(
  fieldName: string,
  options?: Omit<ArrayFieldOptions<T>, "required">
): FieldValidator<T[] | undefined>;

export function optionalArray<T>(
  fieldName: string = "Array",
  options: Omit<ArrayFieldOptions<T>, "required"> = {}
): FieldValidator<T[] | undefined> {
  return arrayField<T>(fieldName, { ...options, required: false });
}
