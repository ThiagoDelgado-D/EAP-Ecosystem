import { describe, expect, test } from "vitest";
import { booleanField, optionalBoolean } from "./boolean-validator.js";

describe("booleanField", () => {
  const validate = booleanField("IsActive");

  test("Should return true when value is true", () => {
    expect(validate(true)).toEqual({ isValid: true, value: true });
  });

  test("Should fail when value is not a boolean", () => {
    const cases = [1, 0, "true", "false", {}, []];

    for (const c of cases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "IsActive must be a boolean",
      });
    }
  });

  test("Should fail when required value is undefined", () => {
    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "IsActive is required",
    });
  });

  test("Should fail when required value is null", () => {
    expect(validate(null)).toEqual({
      isValid: false,
      error: "IsActive is required",
    });
  });

  test("Should use default field name when no field name is provided", () => {
    const defaultValidate = booleanField();
    expect(defaultValidate(123)).toEqual({
      isValid: false,
      error: "Field must be a boolean",
    });
  });
});
describe("optional booleans", () => {
  const validate = booleanField("IsActive", { required: false });

  test("Should return undefined when value is null", () => {
    expect(validate(null)).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is undefined", () => {
    expect(validate(undefined)).toEqual({ isValid: true, value: undefined });
  });

  test("Should accept valid boolean when provided", () => {
    expect(validate(true)).toEqual({ isValid: true, value: true });
    expect(validate(false)).toEqual({ isValid: true, value: false });
  });

  test("Should reject non-boolean when provided", () => {
    expect(validate("true")).toEqual({
      isValid: false,
      error: "IsActive must be a boolean",
    });
  });
});
describe("custom error messages", () => {
  test("Should use custom required message", () => {
    const validate = booleanField("Status", {
      requiredMessage: "Please select a status",
    });

    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Please select a status",
    });
  });

  test("Should use custom type message", () => {
    const validate = booleanField("Status", {
      typeMessage: "Status should be true or false",
    });

    expect(validate("yes")).toEqual({
      isValid: false,
      error: "Status should be true or false",
    });
  });
});
describe("optionalBoolean (wrapper function)", () => {
  test("Should return undefined for null/undefined", () => {
    const validate = optionalBoolean("IsActive");

    expect(validate(null)).toEqual({ isValid: true, value: undefined });
    expect(validate(undefined)).toEqual({ isValid: true, value: undefined });
  });

  test("Should validate boolean when provided", () => {
    const validate = optionalBoolean("IsActive");

    expect(validate(true)).toEqual({ isValid: true, value: true });
    expect(validate(false)).toEqual({ isValid: true, value: false });
    expect(validate("true")).toEqual({
      isValid: false,
      error: "IsActive must be a boolean",
    });
  });
});
