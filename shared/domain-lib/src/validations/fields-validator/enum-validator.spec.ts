import { describe, expect, test } from "vitest";
import { enumValidator } from "./enum-validator";

describe("enumValidator", () => {
  const colors = ["red", "green", "blue"] as const;
  const validate = enumValidator(colors);

  test("Should pass with a valid value", () => {
    expect(validate("red")).toEqual({ isValid: true, value: "red" });
  });

  test("Should fail when value is not a string", () => {
    expect(validate(123 as any)).toEqual({
      isValid: false,
      error: "Enum must be a string",
    });
  });

  test("Should fail when value is not in allowed list", () => {
    expect(validate("yellow")).toEqual({
      isValid: false,
      error: "Enum must be one of: red, green, blue",
    });
  });

  test("Should sanitize input and match allowed value", () => {
    expect(validate("  green  ")).toEqual({ isValid: true, value: "green" });
  });

  test("Should normalize and collapse spaces if configured", () => {
    const validateWithOpts = enumValidator(colors, "Enum", {
      collapseSpaces: true,
    });
    expect(validateWithOpts("  g r e e n  ")).toEqual({
      isValid: false,
      error: "Enum must be one of: red, green, blue",
    });
  });
});
