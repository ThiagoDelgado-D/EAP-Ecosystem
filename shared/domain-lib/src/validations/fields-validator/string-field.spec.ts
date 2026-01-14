import { describe, expect, test } from "vitest";
import {
  stringField,
  optionalString,
  urlField,
  emailField,
} from "./string-field.js";

describe("stringField - basic validations (required by default)", () => {
  const validate = stringField("Title");

  test("Should return trimmed string when value is a valid non-empty string", () => {
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when value is not a string", () => {
    const result = validate(123);
    expect(result).toEqual({ isValid: false, error: "Title must be a string" });
  });

  test("Should return error when value is not a string (multiple cases)", () => {
    const cases = [123, false, true, {}, [], null, undefined];
    for (const c of cases) {
      const result = validate(c as any);
      expect(result.isValid).toBe(false);
    }
  });

  test("Should return error when value is an empty or blank string", () => {
    const result = validate("   ");
    expect(result).toEqual({ isValid: false, error: "Title is required" });
  });

  test("Should return error when value is an empty string", () => {
    const result = validate("");
    expect(result).toEqual({ isValid: false, error: "Title is required" });
  });

  test("Should use default field name when no field name is provided", () => {
    const validate = stringField();
    const result = validate(1);
    expect(result).toEqual({
      isValid: false,
      error: "Field must be a string",
    });
  });
});

describe("optionals string", () => {
  const validate = stringField("Title", { required: false });

  test("Should return undefined when value is null", () => {
    const result = validate(null);
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is undefined", () => {
    const result = validate(undefined);
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is an empty string", () => {
    const result = validate("");
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is a blank string", () => {
    const result = validate("   ");
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return trimmed string when value is a non-empty string", () => {
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });
});

describe("maxLength validation", () => {
  test("Should return value when string length is within limit", () => {
    const validate = stringField("Field", { maxLength: 10 });
    const result = validate("Hello");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should fail when string length exceeds limit", () => {
    const validate = stringField("Field", { maxLength: 5 });
    const result = validate("Hello World");

    expect(result).toEqual({
      isValid: false,
      error: "Field must be at most 5 characters",
    });
  });

  test("Should return trimmed string when value contains surrounding spaces", () => {
    const validate = stringField("Field", { maxLength: 10 });
    const result = validate("   Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when trimmed value exceeds max length", () => {
    const validate = stringField("Field", { maxLength: 5 });
    const result = validate("   Hellooo   ");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be at most 5 characters",
    });
  });

  test("Should return value when length is exactly max length", () => {
    const validate = stringField("Field", { maxLength: 5 });
    const result = validate("Hello");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should return error when length exceeds max length by one", () => {
    const validate = stringField("Field", { maxLength: 5 });
    const result = validate("Hello!");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be at most 5 characters",
    });
  });

  test("Should handle special characters when within length limit", () => {
    const validate = stringField("Field", { maxLength: 10 });
    const result = validate("Café");
    expect(result).toEqual({ isValid: true, value: "Café" });
  });

  test("Should handle emoji when within length limit", () => {
    const validate = stringField("Field", { maxLength: 5 });
    const result = validate("Hi 👋");
    expect(result).toEqual({ isValid: true, value: "Hi 👋" });
  });
});

describe("minLength validation", () => {
  test("Should return error when string is too short", () => {
    const validate = stringField("Field", { minLength: 3 });
    const result = validate("Hi");
    expect(result).toEqual({
      isValid: false,
      error: "Field must be at least 3 characters",
    });
  });

  test("Should return success when string meets min length", () => {
    const validate = stringField("Field", { minLength: 3 });
    const result = validate("Hello");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should work with min and max together", () => {
    const validate = stringField("Field", { minLength: 3, maxLength: 5 });
    expect(validate("Hi")).toEqual({
      isValid: false,
      error: "Field must be at least 3 characters",
    });
    expect(validate("Hello")).toEqual({
      isValid: true,
      value: "Hello",
    });
    expect(validate("Hello!")).toEqual({
      isValid: false,
      error: "Field must be at most 5 characters",
    });
  });
});

describe("Pattern validation", () => {
  test("Should validate against regex pattern", () => {
    const validate = stringField("Code", {
      pattern: {
        regex: /^[A-Z]{3}$/,
        message: "Code must be 3 uppercase letters",
      },
    });

    expect(validate("ABC")).toEqual({ isValid: true, value: "ABC" });
    expect(validate("abc")).toEqual({
      isValid: false,
      error: "Code must be 3 uppercase letters",
    });
    expect(validate("ABCD")).toEqual({
      isValid: false,
      error: "Code must be 3 uppercase letters",
    });
  });

  test("Should use default pattern message when not provided", () => {
    const validate = stringField("Field", {
      pattern: { regex: /^\d+$/ },
    });

    expect(validate("123")).toEqual({ isValid: true, value: "123" });
    expect(validate("abc")).toEqual({
      isValid: false,
      error: "Field has invalid format",
    });
  });
});

describe("trim option", () => {
  test("Should not trim when trim is false", () => {
    const validate = stringField("Field", { trim: false });
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "  Hello  " });
  });

  test("Should trim by default", () => {
    const validate = stringField("Field");
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });

  test("Should validate length after trimming", () => {
    const validate = stringField("Field", { maxLength: 5 });
    const result = validate("  Hello  ");
    expect(result).toEqual({ isValid: true, value: "Hello" });
  });
});

describe("allowEmpty option", () => {
  test("Should allow empty string when allowEmpty is true", () => {
    const validate = stringField("Comment", { allowEmpty: true });
    expect(validate("")).toEqual({ isValid: true, value: "" });
  });

  test("Should allow blank string (only spaces) when allowEmpty is true and trim is true", () => {
    const validate = stringField("Comment", { allowEmpty: true });
    expect(validate("   ")).toEqual({ isValid: true, value: "" });
  });

  test("Should preserve spaces when allowEmpty is true and trim is false", () => {
    const validate = stringField("Comment", { allowEmpty: true, trim: false });
    expect(validate("   ")).toEqual({ isValid: true, value: "   " });
  });

  test("Should not allow empty string when allowEmpty is false (default)", () => {
    const validate = stringField("Comment");
    expect(validate("")).toEqual({
      isValid: false,
      error: "Comment is required",
    });
  });

  test("Should work with required false and allowEmpty true", () => {
    const validate = stringField("Comment", {
      required: false,
      allowEmpty: true,
    });
    expect(validate("")).toEqual({ isValid: true, value: "" });
    expect(validate(undefined)).toEqual({ isValid: true, value: undefined });
  });

  test("Should work with required true and allowEmpty true", () => {
    const validate = stringField("Comment", {
      required: true,
      allowEmpty: true,
    });
    expect(validate("")).toEqual({ isValid: true, value: "" });
    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Comment is required",
    });
  });
});

describe("custom error message", () => {
  test("Should use custom required message", () => {
    const validate = stringField("Name", {
      requiredMessage: "Please enter your name",
    });

    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Please enter your name",
    });
  });

  test("Should use custom type message", () => {
    const validate = stringField("Name", {
      typeMessage: "Name should be text",
    });

    expect(validate(123)).toEqual({
      isValid: false,
      error: "Name should be text",
    });
  });
});

describe("optionalString (wrapper function)", () => {
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

  test("Should pass through other options", () => {
    const validate = optionalString("Code", {
      pattern: { regex: /^[A-Z]{3}$/ },
    });
    expect(validate("ABC")).toEqual({ isValid: true, value: "ABC" });
    expect(validate("abc")).toEqual({
      isValid: false,
      error: "Code has invalid format",
    });
  });
});

describe("urlField", () => {
  describe("default behavior (required by default)", () => {
    const validate = urlField("Website");

    test("Should return error when value is undefined (now required by default)", () => {
      const result = validate(undefined);
      expect(result).toEqual({
        isValid: false,
        error: "Website is required",
      });
    });

    test("Should return error when value is null", () => {
      const result = validate(null);
      expect(result).toEqual({
        isValid: false,
        error: "Website is required",
      });
    });

    test("Should return error when value is an empty string", () => {
      const result = validate("");
      expect(result).toEqual({
        isValid: false,
        error: "Website is required",
      });
    });

    test("Should return error when value is blank spaces", () => {
      const result = validate("   ");
      expect(result).toEqual({
        isValid: false,
        error: "Website is required",
      });
    });

    test("Should return error when value is not a string", () => {
      const result = validate(123 as any);
      expect(result).toEqual({
        isValid: false,
        error: "Website must be a string",
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
        error: "Website must be a valid URL",
      });
    });

    test("Should accept URLs without protocol", () => {
      const result = validate("example.com");
      expect(result.isValid).toBe(true);
    });
  });

  describe("optional URLs", () => {
    const validate = urlField("Website", { required: false });

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
  });
});

describe("emailField", () => {
  const validate = emailField("Email");

  test("Should validate correct email", () => {
    expect(validate("test@example.com")).toEqual({
      isValid: true,
      value: "test@example.com",
    });
  });

  test("Should reject invalid email", () => {
    expect(validate("not-an-email")).toEqual({
      isValid: false,
      error: "Email must be a valid email address",
    });
  });

  test("Should trim email addresses", () => {
    expect(validate("  test@example.com  ")).toEqual({
      isValid: true,
      value: "test@example.com",
    });
  });

  test("Should be required by default", () => {
    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Email is required",
    });
  });
  test("Should convert uppercase email to lowercase", () => {
    expect(validate("TEST@EXAMPLE.COM")).toEqual({
      isValid: true,
      value: "test@example.com",
    });
  });

  test("Should convert mixed case email to lowercase", () => {
    expect(validate("Test.User@Example.Com")).toEqual({
      isValid: true,
      value: "test.user@example.com",
    });
  });

  test("Should trim email addresses", () => {
    expect(validate("  test@example.com  ")).toEqual({
      isValid: true,
      value: "test@example.com",
    });
  });
});

describe("email edge cases and special characters", () => {
  const validate = emailField("Email");

  test("Should handle emails with plus addressing", () => {
    expect(validate("test+tag@example.com")).toEqual({
      isValid: true,
      value: "test+tag@example.com",
    });
  });

  test("Should handle emails with dots", () => {
    expect(validate("first.last@company.co.uk")).toEqual({
      isValid: true,
      value: "first.last@company.co.uk",
    });
  });

  test("Should handle emails with hyphens", () => {
    expect(validate("user-name@domain-name.com")).toEqual({
      isValid: true,
      value: "user-name@domain-name.com",
    });
  });

  test("Should handle emails with numbers", () => {
    expect(validate("user123@domain456.com")).toEqual({
      isValid: true,
      value: "user123@domain456.com",
    });
  });

  test("Should handle emails with underscores", () => {
    expect(validate("user_name@domain.com")).toEqual({
      isValid: true,
      value: "user_name@domain.com",
    });
  });
});

describe("edge cases", () => {
  test("Should handle zero maxLength correctly", () => {
    const validate = stringField("Field", { maxLength: 0 });
    expect(validate("a")).toEqual({
      isValid: false,
      error: "Field must be at most 0 characters",
    });
    expect(validate("")).toEqual({
      isValid: false,
      error: "Field is required",
    });
  });

  test("Should handle zero minLength correctly", () => {
    const validate = stringField("Field", { minLength: 0 });
    expect(validate("")).toEqual({
      isValid: false,
      error: "Field is required",
    });
    expect(validate("a")).toEqual({ isValid: true, value: "a" });
  });

  test("Should handle zero minLength with allowEmpty true", () => {
    const validate = stringField("Field", { minLength: 0, allowEmpty: true });
    expect(validate("")).toEqual({ isValid: true, value: "" });
  });

  test("Should handle very large strings", () => {
    const longString = "a".repeat(1000);
    const validate = stringField("Field", { maxLength: 1000 });
    expect(validate(longString)).toEqual({ isValid: true, value: longString });

    const validate2 = stringField("Field", { maxLength: 999 });
    expect(validate2(longString)).toEqual({
      isValid: false,
      error: "Field must be at most 999 characters",
    });
  });

  test("Should handle strings with only spaces and trim", () => {
    const validate = stringField("Field", { required: false });
    expect(validate("   ")).toEqual({ isValid: true, value: undefined });

    const validate2 = stringField("Field", { required: false, trim: false });
    expect(validate2("   ")).toEqual({ isValid: true, value: "   " });
  });
});
