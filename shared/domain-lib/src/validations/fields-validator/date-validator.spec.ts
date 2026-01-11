import { describe, test, expect } from "vitest";
import { dateField, optionalDate } from "./date-validator";

describe("dateField - basic validations (required by default)", () => {
  const validate = dateField("createdAt");

  test("Should validate a correct Date", () => {
    const date = new Date("2024-01-15");
    expect(validate(date)).toEqual({
      isValid: true,
      value: date,
    });
  });

  test("Should fail for invalid dates", () => {
    const invalidDate = new Date("invalid");
    expect(validate(invalidDate)).toEqual({
      isValid: false,
      error: "createdAt must be a valid date",
    });
  });

  test("Should fail for non-Date values", () => {
    const invalidCases = [123, "2024-01-15", {}, [], true, false];
    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "createdAt must be a valid date",
      });
    }
  });

  test("Should fail when required value is undefined or null", () => {
    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "createdAt is required",
    });
    expect(validate(null)).toEqual({
      isValid: false,
      error: "createdAt is required",
    });
  });

  test("Should use default field name when not provided", () => {
    const validate = dateField();
    expect(validate("not-a-date")).toEqual({
      isValid: false,
      error: "Date must be a valid date",
    });
  });
});

describe("dateField - optional dates", () => {
  const validate = dateField("lastViewed", { required: false });

  test("Should accept undefined and null for optional dates", () => {
    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });
    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });
  });
});

describe("dateField - parseString option", () => {
  test("Should parse valid date strings when parseString is true", () => {
    const validate = dateField("BirthDate", { parseString: true });

    const dateString = "2024-01-15T10:30:00.000Z";
    const expectedDate = new Date(dateString);

    expect(validate(dateString)).toEqual({
      isValid: true,
      value: expectedDate,
    });
  });

  test("Should reject invalid date strings", () => {
    const validate = dateField("BirthDate", { parseString: true });

    expect(validate("not-a-date")).toEqual({
      isValid: false,
      error: "BirthDate must be a valid date",
    });
  });

  test("Should still accept Date objects when parseString is true", () => {
    const validate = dateField("BirthDate", { parseString: true });
    const date = new Date();

    expect(validate(date)).toEqual({
      isValid: true,
      value: date,
    });
  });
});

describe("dateField - min and max constraints", () => {
  const minDate = new Date("2025-01-01");
  const maxDate = new Date("2025-12-31");

  test("Should validate date within range", () => {
    const validate = dateField("EventDate", {
      min: minDate,
      max: maxDate,
    });

    const validDate = new Date("2025-06-15");
    expect(validate(validDate)).toEqual({
      isValid: true,
      value: validDate,
    });
  });

  test("Should reject date after max", () => {
    const validate = dateField("EventDate", { max: maxDate });

    const lateDate = new Date("2026-01-01");
    expect(validate(lateDate)).toEqual({
      isValid: false,
      error: `EventDate must be on or before ${maxDate.toISOString()}`,
    });
  });

  test("Should reject date before min", () => {
    const validate = dateField("EventDate", { min: minDate });

    const earlyDate = new Date("2024-12-31");
    expect(validate(earlyDate)).toEqual({
      isValid: false,
      error: `EventDate must be on or after ${minDate.toISOString()}`,
    });
  });

  test("Should accept date exactly at min or max", () => {
    const validate = dateField("EventDate", {
      min: minDate,
      max: maxDate,
    });

    expect(validate(minDate)).toEqual({
      isValid: true,
      value: minDate,
    });

    expect(validate(maxDate)).toEqual({
      isValid: true,
      value: maxDate,
    });
  });
});

describe("dateField - transform option", () => {
  test("Should apply transformation after validation", () => {
    const validate = dateField("Date", {
      transform: (date) => {
        const normalized = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );
        return normalized;
      },
    });

    const date = new Date("2025-01-15T14:30:45.123Z");
    const expected = new Date("2025-01-15T00:00:00.000Z");

    expect(validate(date)).toEqual({
      isValid: true,
      value: expected,
    });
  });
});

describe("dateField - custom error messages", () => {
  test("Should use custom required message", () => {
    const validate = dateField("EventDate", {
      requiredMessage: "Please select an event date",
    });

    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Please select an event date",
    });
  });

  test("Should use custom type message", () => {
    const validate = dateField("EventDate", {
      typeMessage: "Please provide a valid date format",
    });

    expect(validate("not-a-date")).toEqual({
      isValid: false,
      error: "Please provide a valid date format",
    });
  });
});

describe("optionalDate - wrapper function", () => {
  test("Should return undefined for null/undefined", () => {
    const validate = optionalDate("lastViewed");

    expect(validate(null)).toEqual({ isValid: true, value: undefined });
    expect(validate(undefined)).toEqual({ isValid: true, value: undefined });
  });

  test("Should validate date when provided", () => {
    const validate = optionalDate("lastViewed");
    const date = new Date();

    expect(validate(date)).toEqual({ isValid: true, value: date });
    expect(validate(new Date("invalid"))).toEqual({
      isValid: false,
      error: "lastViewed must be a valid date",
    });
  });
});
