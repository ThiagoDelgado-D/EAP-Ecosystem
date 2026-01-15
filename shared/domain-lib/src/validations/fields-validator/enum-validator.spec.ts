import { describe, test, expect } from "vitest";
import { enumField, optionalEnum } from "./enum-validator.js";

const STATUS_VALUES = ["active", "inactive", "pending"] as const;
type Status = (typeof STATUS_VALUES)[number];

const ROLE_VALUES = ["admin", "user", "guest"] as const;
type Role = (typeof ROLE_VALUES)[number];

describe("enumField - basic validations (required by default)", () => {
  const validate = enumField(STATUS_VALUES, "Status");

  test("Should validate a correct enum value", () => {
    expect(validate("active")).toEqual({
      isValid: true,
      value: "active",
    });

    expect(validate("inactive")).toEqual({
      isValid: true,
      value: "inactive",
    });
  });

  test("Should trim whitespace by default", () => {
    expect(validate("  active  ")).toEqual({
      isValid: true,
      value: "active",
    });
  });

  test("Should reject values not in allowed list", () => {
    const invalidCases = ["invalid", "ACTIVE", "Active", "unknown"];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "Status must be one of: active, inactive, pending",
      });
    }
  });

  test("Should reject empty string with required message", () => {
    expect(validate("")).toEqual({
      isValid: false,
      error: "Status is required",
    });

    expect(validate("   ")).toEqual({
      isValid: false,
      error: "Status is required",
    });
  });

  test("Should reject non-string values", () => {
    const invalidCases = [123, {}, [], true, false];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "Status must be a string",
      });
    }
  });

  test("Should reject null and undefined when required", () => {
    expect(validate(null)).toEqual({
      isValid: false,
      error: "Status is required",
    });

    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Status is required",
    });
  });

  test("Should use default field name when not provided", () => {
    const validate = enumField(STATUS_VALUES);
    expect(validate("invalid")).toEqual({
      isValid: false,
      error: "Enum must be one of: active, inactive, pending",
    });
  });
});

describe("enumField - case sensitivity", () => {
  test("Should reject uppercase by default (case sensitive)", () => {
    const validate = enumField(STATUS_VALUES, "Status");

    expect(validate("ACTIVE")).toEqual({
      isValid: false,
      error: "Status must be one of: active, inactive, pending",
    });
  });

  test("Should accept uppercase when toLowerCase is true", () => {
    const validate = enumField(STATUS_VALUES, "Status", {
      toLowerCase: true,
    });

    expect(validate("ACTIVE")).toEqual({
      isValid: true,
      value: "active",
    });

    expect(validate("Active")).toEqual({
      isValid: true,
      value: "active",
    });
  });
});

describe("enumField - space handling", () => {
  const VALUES = ["hello world", "test value"] as const;

  test("Should collapse multiple spaces when collapseSpaces is true", () => {
    const validate = enumField(VALUES, "TestField", {
      collapseSpaces: true,
    });

    expect(validate("hello   world")).toEqual({
      isValid: true,
      value: "hello world",
    });
  });

  test("Should not collapse spaces by default", () => {
    const validate = enumField(VALUES, "TestField");

    expect(validate("hello   world")).toEqual({
      isValid: false,
      error: "TestField must be one of: hello world, test value",
    });
  });
});

describe("enumField - optional enums", () => {
  const validate = enumField(STATUS_VALUES, "OptionalStatus", {
    required: false,
  });

  test("Should accept null and undefined for optional enum", () => {
    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should accept empty string for optional enum", () => {
    expect(validate("")).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate("   ")).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate enum value when provided", () => {
    expect(validate("active")).toEqual({
      isValid: true,
      value: "active",
    });

    expect(validate("invalid")).toEqual({
      isValid: false,
      error: "OptionalStatus must be one of: active, inactive, pending",
    });
  });
});

describe("enumField - transform option", () => {
  test("Should apply transformation after validation", () => {
    const validate = enumField(STATUS_VALUES, "Status", {
      transform: (value) => value.toUpperCase() as Status,
    });

    expect(validate("active")).toEqual({
      isValid: true,
      value: "ACTIVE",
    });
  });

  test("Should transform after case normalization", () => {
    const validate = enumField(STATUS_VALUES, "Status", {
      toLowerCase: true,
      transform: (value) => value.toUpperCase() as Status,
    });

    expect(validate("Active")).toEqual({
      isValid: true,
      value: "ACTIVE",
    });
  });
});

describe("enumField - custom error messages", () => {
  test("Should use custom required message", () => {
    const validate = enumField(STATUS_VALUES, "Status", {
      requiredMessage: "Please select a status",
    });

    expect(validate(null)).toEqual({
      isValid: false,
      error: "Please select a status",
    });
  });

  test("Should use custom type message", () => {
    const validate = enumField(STATUS_VALUES, "Status", {
      typeMessage: "Status must be text",
    });

    expect(validate(123)).toEqual({
      isValid: false,
      error: "Status must be text",
    });
  });

  test("Should use custom invalid value message", () => {
    const validate = enumField(STATUS_VALUES, "Status", {
      invalidValueMessage: "Please select a valid status option",
    });

    expect(validate("invalid")).toEqual({
      isValid: false,
      error: "Please select a valid status option",
    });
  });
});

describe("optionalEnum - wrapper function", () => {
  test("Should return undefined for null/undefined", () => {
    const validate = optionalEnum(STATUS_VALUES, "UserStatus");

    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate enum value when provided", () => {
    const validate = optionalEnum(ROLE_VALUES, "UserRole");

    expect(validate("admin")).toEqual({
      isValid: true,
      value: "admin",
    });

    expect(validate("invalid")).toEqual({
      isValid: false,
      error: "UserRole must be one of: admin, user, guest",
    });
  });

  test("Should pass through options", () => {
    const validate = optionalEnum(STATUS_VALUES, "Status", {
      toLowerCase: true,
    });

    expect(validate("ACTIVE")).toEqual({
      isValid: true,
      value: "active",
    });
  });
});

describe("enumField - edge cases", () => {
  test("Should handle single enum value", () => {
    const SINGLE_VALUES = ["only"] as const;
    const validate = enumField(SINGLE_VALUES, "SingleField");

    expect(validate("only")).toEqual({
      isValid: true,
      value: "only",
    });

    expect(validate("other")).toEqual({
      isValid: false,
      error: "SingleField must be one of: only",
    });
  });

  test("Should handle enum with special characters", () => {
    const SPECIAL_VALUES = ["test-value", "test_value", "test.value"] as const;
    const validate = enumField(SPECIAL_VALUES, "SpecialField");

    expect(validate("test-value")).toEqual({
      isValid: true,
      value: "test-value",
    });

    expect(validate("test_value")).toEqual({
      isValid: true,
      value: "test_value",
    });
  });

  test("Should handle numeric strings if in enum", () => {
    const NUMERIC_VALUES = ["123", "456"] as const;
    const validate = enumField(NUMERIC_VALUES, "NumericField");

    expect(validate("123")).toEqual({
      isValid: true,
      value: "123",
    });

    expect(validate(123)).toEqual({
      isValid: false,
      error: "NumericField must be a string",
    });
  });
});
