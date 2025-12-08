import { describe, test, expect } from "vitest";
import { requiredDate, optionalDate } from "./date-validator";

describe("dateValidator", () => {
  test("Should validate a correct Date", () => {
    const validate = requiredDate("createdAt");
    const date = new Date();

    const result = validate(date);

    expect(result).toEqual({
      isValid: true,
      value: date,
    });
  });

  test("Should fail when the value is not a date", () => {
    const validate = requiredDate("createdAt");

    const invalidCases = [null, undefined, 123, "2020", {}, [], NaN];

    for (const c of invalidCases) {
      expect(validate(c as any)).toEqual({
        isValid: false,
        error: "createdAt must be a valid date",
      });
    }
  });

  test("Should fail when date is invalid", () => {
    const validate = requiredDate("createdAt");
    const invalidDate = new Date("invalid");

    expect(validate(invalidDate)).toEqual({
      isValid: false,
      error: "createdAt must be a valid date",
    });
  });
});

describe("optionalDate", () => {
  test("Should accept undefined for optional date", () => {
    const validate = optionalDate("lastViewed");

    const result = validate(undefined);

    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should accept null for optional date", () => {
    const validate = optionalDate("lastViewed");

    const result = validate(null as any);

    expect(result).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate a correct date in optional date", () => {
    const validate = optionalDate("lastViewed");
    const date = new Date();

    const result = validate(date);

    expect(result).toEqual({
      isValid: true,
      value: date,
    });
  });

  test("Should fail invalid dates in optional date", () => {
    const validate = optionalDate("lastViewed");

    const invalidDate = new Date("invalid");

    expect(validate(invalidDate)).toEqual({
      isValid: false,
      error: "lastViewed must be a valid date",
    });
  });
});
