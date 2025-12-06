import { describe, expect, test } from "vitest";
import {
  optionalString,
  requiredString,
  stringWithMaxLength,
  urlString,
} from "./string-validator";

describe("stringValidator", () => {
  const validateRequired = requiredString("Title");

  test("Should return trimmed string when value is a valid non-empty string", () => {
    const result = validateRequired("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when value is not a string", () => {
    const result = validateRequired(123);
    expect(result).toEqual({ isValid: false, error: "Title must be a string" });
  });

  test("Should return error when value is not a string (multiple cases)", () => {
    const cases = [123, false, true, {}, [], null, undefined, new String("a")];
    for (const c of cases) {
      const result = validateRequired(c as any);
      expect(result).toEqual({
        isValid: false,
        error: "Title must be a string",
      });
    }
  });

  test("Should return error when value is an empty or blank string", () => {
    const result = validateRequired("   ");
    expect(result).toEqual({ isValid: false, error: "Title is required" });
  });

  test("Should return error when value is an empty string", () => {
    const result = validateRequired("");
    expect(result).toEqual({ isValid: false, error: "Title is required" });
  });

  test("Should use default field name when no field name is provided", () => {
    const validate = requiredString();
    const result = validate(1);
    expect(result).toEqual({
      isValid: false,
      error: "Field must be a string",
    });
  });
});

describe("optionalString", () => {
  test("Should return undefined when value is null", () => {
    const validate = optionalString();
    const result = validate(null);
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is undefined", () => {
    const validate = optionalString();
    const result = validate(undefined);
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is an empty string", () => {
    const validate = optionalString();
    const result = validate("");
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is a blank string", () => {
    const validate = optionalString();
    const result = validate("   ");
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return trimmed string when value is a non-empty string", () => {
    const validate = optionalString();
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when value is not a string", () => {
    const validate = optionalString("CustomField");
    const result = validate(123);
    expect(result).toEqual({
      isValid: false,
      error: "CustomField must be a string",
    });
  });
});

describe("stringWithMaxLength", () => {
  test("Should return value when string length is within limit", () => {
    const validate = stringWithMaxLength(10);
    const result = validate("Hello");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when value is not a string", () => {
    const validate = stringWithMaxLength(10);
    const result = validate(123);
    expect(result).toEqual({
      isValid: false,
      error: "Field must be a string",
    });
  });

  test("Should return error when value is undefined", () => {
    const validate = stringWithMaxLength(10);
    const result = validate(undefined);
    expect(result).toEqual({
      isValid: false,
      error: "Field must be a string",
    });
  });

  test("Should fail when string length exceeds limit", () => {
    const validate = stringWithMaxLength(5);
    const result = validate("Hello World");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be less than 5 characters",
    });
  });

  test("Should return trimmed string when value contains surrounding spaces", () => {
    const validate = stringWithMaxLength(10);
    const result = validate("   Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when trimmed value exceeds max length", () => {
    const validate = stringWithMaxLength(5);
    const result = validate("   Hellooo   ");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be less than 5 characters",
    });
  });

  test("Should return value when length is exactly max length", () => {
    const validate = stringWithMaxLength(5);
    const result = validate("Hello");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when length exceeds max length by one", () => {
    const validate = stringWithMaxLength(5);
    const result = validate("Hello!");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be less than 5 characters",
    });
  });

  test("Should return error when value is blank string", () => {
    const validate = stringWithMaxLength(5);
    const result = validate("   ");
    expect(result).toEqual({
      isValid: false,
      error: "Field is required",
    });
  });

  test("Should return custom field error when field name is provided", () => {
    const validate = stringWithMaxLength(5, "Username");
    const result = validate(123);
    expect(result).toEqual({
      isValid: false,
      error: "Username must be a string",
    });
  });

  test("Should return error when maxLength is zero and value is not empty", () => {
    const validate = stringWithMaxLength(0);
    const result = validate("a");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be less than 0 characters",
    });
  });

  test("Should return value when maxLength is zero and value is empty string", () => {
    const validate = stringWithMaxLength(0);
    const result = validate("");
    expect(result).toEqual({
      isValid: false,
      error: "Field is required",
    });
  });

  test("Should handle special characters when within length limit", () => {
    const validate = stringWithMaxLength(10);
    const result = validate("Café");
    expect(result).toEqual({ isValid: true, value: "Café" });
  });

  test("Should handle emoji when within length limit", () => {
    const validate = stringWithMaxLength(5);
    const result = validate("Hi 👋");
    expect(result).toEqual({ isValid: true, value: "Hi 👋" });
  });
});

describe("urlString", () => {
  const validate = urlString();

  test("Should return undefined when value is undefined", () => {
    const result = validate(undefined);
    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should return undefined when value is null", () => {
    const result = validate(null);
    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should return undefined when value is an empty string", () => {
    const result = validate("");
    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should return undefined when value is blank spaces", () => {
    const result = validate("   ");
    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should return error when value is not a string", () => {
    const result = validate(123 as any);
    expect(result).toEqual({
      isValid: false,
      error: "URL must be a string",
    });
  });

  test("Should return valid trimmed value when URL is correct", () => {
    const result = validate("   https://example.com/path   ");
    expect(result).toEqual({
      isValid: true,
      value: "https://example.com/path",
    });
  });

  test("Should return error when URL format is invalid", () => {
    const result = validate("notaurl");
    expect(result).toEqual({
      isValid: false,
      error: "Invalid URL format",
    });
  });

  test("Should return error when URL lacks protocol", () => {
    const result = validate("example.com");
    expect(result).toEqual({
      isValid: false,
      error: "Invalid URL format",
    });
  });

  test("Should return error when URL is malformed", () => {
    const result = validate("http://");
    expect(result).toEqual({
      isValid: false,
      error: "Invalid URL format",
    });
  });

  test("Should use custom field name in error message when provided", () => {
    const customValidate = urlString("Website");
    const result = customValidate(123 as any);
    expect(result).toEqual({
      isValid: false,
      error: "Website must be a string",
    });
  });
});
