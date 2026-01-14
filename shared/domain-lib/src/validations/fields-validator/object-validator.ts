import type {
  FieldValidationResult,
  FieldValidator,
  ValidationSchemaMap,
} from "../validation-schema.js";
import type { ValidatorOptions } from "./validator-options.js";

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

/**
 * Creates a validator for object fields that enforces requiredness, type, and an optional per-key schema.
 *
 * @param fieldName - Human-readable name used in generated error messages (defaults to "Object").
 * @param options - Validation options:
 *   - `required`: whether the field must be present (default `true`).
 *   - `requiredMessage`: custom message when a required value is missing.
 *   - `typeMessage`: custom message when the value is not an object or is an array.
 *   - `schema`: a map of property validators applied to the object's keys; validation failures are reported as `fieldName.key: <error>`.
 * @returns A FieldValidator that yields a FieldValidationResult whose `value` is the validated object (with validated property values applied) or `undefined` when the field is optional; on failure `isValid` is `false` and `error` contains a descriptive message.
 */
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

/**
 * Creates a validator for an object field that permits the field to be omitted.
 *
 * @param fieldName - Human-readable name used in error messages (defaults to "Object")
 * @param options - Validation options (excluding `required`); may include `schema`, `requiredMessage`, and `typeMessage`
 * @returns A FieldValidator that yields a validated object of type `T` or `undefined` when the value is absent
 */
export function optionalObject<T extends Record<string, any>>(
  fieldName: string = "Object",
  options: Omit<ObjectFieldOptions<T>, "required"> = {}
): FieldValidator<T | undefined> {
  return objectField(fieldName, { ...options, required: false });
}
