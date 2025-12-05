import { describe, expect, test } from "vitest";
import { requiredString } from "./string-validator";

describe("stringValidator", () => {
  const validate = requiredString("Title");

  test("Should accept a non-empty string and trim it", () => {
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should reject non-string values", () => {
    const result = validate(123);
    expect(result).toEqual({ isValid: false, error: "Title must be a string" });
  });

  test("Should reject empty strings", () => {
    const result = validate("   ");
    expect(result).toEqual({ isValid: false, error: "Title is required" });
  });

  test("Should reject empty string", () => {
    const result = validate("");
    expect(result).toEqual({ isValid: false, error: "Title is required" });
  });
});
