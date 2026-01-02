import { describe, test, expect, vi } from "vitest";
import { objectField, optionalObject } from "./object-validator";
import { positiveNumber } from "./number-field";
import { booleanField } from "./boolean-validator";
import type { StrictFieldValidator } from "../validation-schema";

describe("objectField", () => {
  const validateDuration = objectField<{
    value: number;
    isEstimated: boolean;
  }>("Duration", {
    required: true,
    schema: {
      value: positiveNumber("Duration.value", { required: true }),
      isEstimated: booleanField("Duration.isEstimated", { required: true }),
    },
  });

  test("Should fail when value is missing or null", () => {
    const validate = objectField("Payload");

    const invalidCases = [null, undefined];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "Payload is required",
      });
    }
  });

  test("Should fail when value is not an object", () => {
    const validate = objectField("Payload");

    const invalidCases = [123, "str", false, true, [], () => {}];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "Payload must be an object",
      });
    }
  });

  test("Should use default field name when none is provided", () => {
    const validate = objectField();

    const result = validate(123);

    expect(result).toEqual({
      isValid: false,
      error: "Object must be an object",
    });
  });

  test("Should accept a valid object when no validators are provided", () => {
    const validate = objectField("Payload");

    const result = validate({ a: 1, b: 2 });

    expect(result).toEqual({
      isValid: true,
      value: { a: 1, b: 2 },
    });
  });

  test("Should validate inner fields and return the processed values from validators", () => {
    const nameValidator = vi.fn((val: unknown) => ({
      isValid: true,
      value: String(val).toUpperCase(),
    })) as StrictFieldValidator<string>;

    const ageValidator = vi.fn((val: unknown) => ({
      isValid: true,
      value: Number(val) + 1,
    })) as StrictFieldValidator<number>;

    const validate = objectField<{ name: string; age: number }>("User", {
      required: true,
      schema: {
        name: nameValidator,
        age: ageValidator,
      },
    });

    const input = { name: "john", age: 29 };
    const result = validate(input);

    expect(nameValidator).toHaveBeenCalledWith("john");
    expect(ageValidator).toHaveBeenCalledWith(29);

    expect(result).toEqual({
      isValid: true,
      value: {
        name: "JOHN",
        age: 30,
      },
    });
  });

  test("Should fail with formatted error message when an inner field is invalid", () => {
    const validate = objectField<{ name: string }>("User", {
      schema: {
        name: () => ({ isValid: false, error: "is too short" }),
      },
    });

    const result = validate({ name: "J" });

    expect(result).toEqual({
      isValid: false,
      error: "User.name: is too short",
    });
  });

  test("Should fail when an inner validator fails", () => {
    const failingValidator: StrictFieldValidator<string> = () => ({
      isValid: false,
      error: "Invalid string",
    });

    const validate = objectField<{ name: string }>("User", {
      required: true,
      schema: { name: failingValidator },
    });

    const result = validate({ name: 123 });

    expect(result).toEqual({
      isValid: false,
      error: "User.name: Invalid string",
    });
  });

  test("Should return valid when all inner validators pass", () => {
    const stringValidator: StrictFieldValidator<string> = (v) =>
      typeof v === "string"
        ? { isValid: true, value: v }
        : { isValid: false, error: "Must be string" };

    const numberValidator: StrictFieldValidator<number> = (v) =>
      typeof v === "number"
        ? { isValid: true, value: v }
        : { isValid: false, error: "Must be number" };

    const validate = objectField<{
      name: string;
      age: number;
    }>("User", {
      required: true,
      schema: {
        name: stringValidator,
        age: numberValidator,
      },
    });

    const result = validate({ name: "Alice", age: 25 });

    expect(result).toEqual({
      isValid: true,
      value: { name: "Alice", age: 25 },
    });
  });

  test("Should validate all fields defined in the schema and return the processed object", () => {
    const nameValidator: StrictFieldValidator<string> = (val: unknown) => ({
      isValid: true,
      value: String(val).toUpperCase(),
    });

    const validate = objectField<{ name: string; age: number | undefined }>(
      "User",
      {
        required: false,
        schema: {
          name: nameValidator,
          age: positiveNumber("age", { required: false }),
        },
      }
    );

    const input = { name: "alice", age: 30 };
    const result = validate(input);

    expect(result.isValid).toBe(true);

    if (result.isValid) {
      expect(result.value).toEqual({
        name: "ALICE",
        age: 30,
      });
    }
  });
  test("Should pass and return undefined when the object is optional and no value is provided", () => {
    const validate = objectField("User", {
      required: false,
      schema: undefined,
    });

    const result = validate(undefined);

    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("should treat null as a valid optional value", () => {
    const validate = optionalObject("User");
    expect(validate(null).isValid).toBe(true);
  });

  test("should pass validation when the value is undefined", () => {
    const validate = optionalObject("Profile", {
      schema: {
        id: positiveNumber("ID"),
      },
    });

    const result = validate(undefined);

    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("should still validate inner fields if a value is provided", () => {
    const validate = optionalObject<{ age: number }>("Profile", {
      schema: {
        age: positiveNumber("Age", { required: false }),
      },
    });

    expect(validate({ age: 25 })).toEqual({
      isValid: true,
      value: { age: 25 },
    });

    const invalidResult = validate({ age: -5 });
    expect(invalidResult.isValid).toBe(false);
    if (!invalidResult.isValid) {
      expect(invalidResult.error).toContain("Profile.age");
    }
  });

  test("Should validate a correct Duration object", () => {
    const result = validateDuration({ value: 120, isEstimated: true });

    expect(result).toEqual({
      isValid: true,
      value: { value: 120, isEstimated: true },
    });
  });

  test("Should fail when value is not an object (Duration)", () => {
    const cases = [123, "abc", [], true];

    for (const c of cases) {
      const result = validateDuration(c);
      expect(result).toEqual({
        isValid: false,
        error: "Duration must be an object",
      });
    }
  });
  test("Should fail when value is missing or null", () => {
    const cases = [null, undefined];

    for (const c of cases) {
      const result = validateDuration(c);
      expect(result).toEqual({
        isValid: false,
        error: "Duration is required",
      });
    }
  });

  test("Should fail when a nested field is invalid (value not a number)", () => {
    const result = validateDuration({ value: "x", isEstimated: false });

    expect(result).toEqual({
      isValid: false,
      error: "Duration.value: Duration.value must be a number",
    });
  });

  test("Should fail when a nested field is invalid (boolean expected)", () => {
    const result = validateDuration({ value: 10, isEstimated: "yes" });

    expect(result).toEqual({
      isValid: false,
      error: "Duration.isEstimated: Duration.isEstimated must be a boolean",
    });
  });
});
