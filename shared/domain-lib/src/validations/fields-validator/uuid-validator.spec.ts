import { describe, expect, test } from "vitest";
import { optionalUUID, uuidField } from "./uuid-validator";

describe("uuidField - basic validations (required by default)", () => {
  const validate = uuidField("ResourceID");

  test("Should validate a correct UUID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(validate(uuid)).toEqual({
      isValid: true,
      value: uuid.toLowerCase(),
    });
  });

  test("Should normalize UUID to lowercase", () => {
    const uuid = "550E8400-E29B-41D4-A716-446655440000";
    expect(validate(uuid)).toEqual({
      isValid: true,
      value: uuid.toLowerCase(),
    });
  });

  test("Should reject non-UUID strings", () => {
    const invalidCases = [
      "not-a-uuid",
      "550e8400",
      "550e8400-e29b-41d4",
      "550e8400-e29b-41d4-a716",
      "12345678-1234-1234-1234-1234567890123",
      "1234567-1234-1234-1234-123456789012",
      "gggggggg-gggg-gggg-gggg-gggggggggggg",
    ];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "ResourceID must be a valid UUID",
      });
    }
  });

  test("Should reject non-string values", () => {
    const invalidCases = [123, {}, [], true, false, new Date()];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "ResourceID must be a valid UUID",
      });
    }
  });

  test("Should reject empty strings when required", () => {
    expect(validate("")).toEqual({
      isValid: false,
      error: "ResourceID is required",
    });

    expect(validate("   ")).toEqual({
      isValid: false,
      error: "ResourceID is required",
    });
  });

  test("Should reject undefined and null when required", () => {
    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "ResourceID is required",
    });

    expect(validate(null)).toEqual({
      isValid: false,
      error: "ResourceID is required",
    });
  });

  test("Should trim whitespace around UUID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(validate(`  ${uuid}  `)).toEqual({
      isValid: true,
      value: uuid,
    });
  });
});

describe("uuidField - optional UUID", () => {
  const validate = uuidField("LastSeenID", { required: false });

  test("Should accept undefined and null for optional UUID", () => {
    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should accept empty string for optional UUID", () => {
    expect(validate("")).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate("   ")).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate UUID when provided for optional field", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(validate(uuid)).toEqual({
      isValid: true,
      value: uuid,
    });

    expect(validate("not-a-uuid")).toEqual({
      isValid: false,
      error: "LastSeenID must be a valid UUID",
    });
  });
});

describe("optionalUUID - function", () => {
  test("Should return undefined for null/undefined", () => {
    const validate = optionalUUID("LastLoginID");

    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate UUID when provided", () => {
    const validate = optionalUUID("TransactionID");
    const uuid = "550e8400-e29b-41d4-a716-446655440000";

    expect(validate(uuid)).toEqual({
      isValid: true,
      value: uuid.toLowerCase(),
    });

    expect(validate("invalid-uuid")).toEqual({
      isValid: false,
      error: "TransactionID must be a valid UUID",
    });
  });
});
