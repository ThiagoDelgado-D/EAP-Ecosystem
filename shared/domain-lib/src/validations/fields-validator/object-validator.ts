import type {
  FieldValidationResult,
  FieldValidator,
  ValidationSchemaMap,
} from "../validation-schema";
import type { ValidatorOptions } from "./validator-options";

export interface ObjectFieldOptions<T> extends ValidatorOptions {
  schema?: ValidationSchemaMap<T>;
}

export function objectField<T extends Record<string, any>>(): FieldValidator<T>;
export function objectField<T extends Record<string, any>>(
  fieldName: string,
  options: { required: true } & ObjectFieldOptions<T>
): FieldValidator<T>;

export function objectField<T extends Record<string, any>>(
  fieldName: string,
  options?: { required?: false } & ObjectFieldOptions<T>
): FieldValidator<T | undefined>;

export function objectField<T extends Record<string, any>>(
  fieldName: string = "Object",
  options: ObjectFieldOptions<T> = {}
): FieldValidator<T | undefined> {
  const {
    required = true,
    requiredMessage = `${fieldName} is required`,
    typeMessage = `${fieldName} must be an object`,
    schema,
  } = options;

  return (value: unknown): FieldValidationResult<T | undefined> => {
    if (value === undefined || value === null) {
      if (required) {
        return { isValid: false, error: requiredMessage };
      }
      return { isValid: true, value: undefined };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return { isValid: false, error: typeMessage };
    }

    const processedValue = { ...value } as T;

    if (schema) {
      for (const key in schema) {
        const validator = schema[key];
        const result = validator((value as any)[key]);

        if (!result.isValid) {
          return {
            isValid: false,
            error: `${fieldName}.${key}: ${result.error}`,
          };
        }

        processedValue[key] = result.value as any;
      }
    }

    return {
      isValid: true,
      value: processedValue,
    };
  };
}

export function optionalObject<T extends Record<string, any>>(
  fieldName: string = "Object",
  options: Omit<ObjectFieldOptions<T>, "required"> = {}
): FieldValidator<T | undefined> {
  return objectField(fieldName, { ...options, required: false });
}
