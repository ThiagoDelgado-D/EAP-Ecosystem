import { describe, expect, test } from "vitest";
import { requiredBoolean } from "./boolean-validator";

describe("requiredBoolean", () => {
  const validate = requiredBoolean("IsActive");

  test("Should return true when value is true", () => {
    expect(validate(true)).toEqual({ isValid: true, value: true });
  });

  test("Should return false when value is false", () => {
    expect(validate(false)).toEqual({ isValid: true, value: false });
  });

  test("Should fail when value is not a boolean", () => {
    const cases = [1, 0, "true", "false", null, undefined, {}, []];
    for (const c of cases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "IsActive must be a boolean",
      });
    }
  });

  test("Should use default field name when none is provided", () => {
    const defaultValidate = requiredBoolean();
    expect(defaultValidate(123)).toEqual({
      isValid: false,
      error: "Field must be a boolean",
    });
  });
});
