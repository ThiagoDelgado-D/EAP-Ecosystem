import { describe, expect, test } from "vitest";
import { requiredUUID } from "./uuid-validator";

describe("uuidValidator", () => {
  const validate = requiredUUID("ResourceID");

  test("Should return valid UUID string when value is a non-empty string", () => {
    const result = validate("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({
      isValid: true,
      value: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  test("Should return error when value is not a string", () => {
    const result = validate(123);
    expect(result).toEqual({
      isValid: false,
      error: "ResourceID must be a string",
    });
  });

  test("Should return error when value is not a string (multiple cases)", () => {
    const cases = [123, false, true, {}, [], null, undefined, new String("a")];

    for (const c of cases) {
      const result = validate(c);
      expect(result).toEqual({
        isValid: false,
        error: "ResourceID must be a string",
      });
    }
  });

  test("Should return error when value is an empty string", () => {
    const result = validate("");
    expect(result).toEqual({
      isValid: false,
      error: "ResourceID is required",
    });
  });

  test("Should use default field when none is provided", () => {
    const defaultValidate = requiredUUID();
    const result = defaultValidate(10);

    expect(result).toEqual({
      isValid: false,
      error: "ID must be a string",
    });
  });

  test("Should return value without trimming (UUID is not trimmed intentionally)", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const result = validate(` ${uuid} `);

    expect(result).toEqual({
      isValid: true,
      value: ` ${uuid} `,
    });
  });
});
