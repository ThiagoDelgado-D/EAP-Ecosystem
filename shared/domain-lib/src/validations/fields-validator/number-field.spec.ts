import { expect, test, describe } from "vitest";
import {
  numberField,
  numberInRange,
  optionalNumber,
  positiveNumber,
} from "./number-field";

describe("numberField - basic validations (required by default)", () => {
  const validate = numberField("Total");

  test("Should accept a valid number", () => {
    const result = validate(10);
    expect(result).toEqual({ isValid: true, value: 10 });
  });

  test("Should accept zero", () => {
    const result = validate(0);
    expect(result).toEqual({ isValid: true, value: 0 });
  });

  test("Should accept negative numbers", () => {
    const result = validate(-5);
    expect(result).toEqual({ isValid: true, value: -5 });
  });

  test("Should return error when value is not a number", () => {
    const result = validate("10" as unknown);
    expect(result).toEqual({
      isValid: false,
      error: "Total must be a number",
    });
  });

  test("Should return error for NaN", () => {
    const result = validate(NaN);
    expect(result).toEqual({
      isValid: false,
      error: "Total must be a number",
    });
  });

  test("Should return error when value is not a number (multiple cases)", () => {
    const cases = [null, undefined, {}, [], false, true, "abc"];
    for (const c of cases) {
      const result = validate(c);
      expect(result.isValid).toBe(false);
    }
  });

  test("Should return error when required value is undefined", () => {
    const result = validate(undefined);
    expect(result).toEqual({
      isValid: false,
      error: "Total is required",
    });
  });

  test("Should use default field name when not provided", () => {
    const defaultValidate = numberField();
    const result = defaultValidate("x");
    expect(result).toEqual({
      isValid: false,
      error: "Number must be a number",
    });
  });
});

describe("numberField - optional numbers", () => {
  const validate = numberField("Total", { required: false });

  test("Should return undefined when value is null", () => {
    const result = validate(null);
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should return undefined when value is undefined", () => {
    const result = validate(undefined);
    expect(result).toEqual({ isValid: true, value: undefined });
  });

  test("Should accept valid number when provided", () => {
    const result = validate(42);
    expect(result).toEqual({ isValid: true, value: 42 });
  });
});

describe("numberField - positive validation", () => {
  test("Should reject negative numbers when positive is true", () => {
    const validate = numberField("Amount", { positive: true });

    expect(validate(10)).toEqual({ isValid: true, value: 10 });
    expect(validate(0)).toEqual({
      isValid: false,
      error: "Amount must be greater than 0",
    });
    expect(validate(-5)).toEqual({
      isValid: false,
      error: "Amount must be greater than 0",
    });
  });

  test("Should accept zero when positive is false (default)", () => {
    const validate = numberField("Amount");
    expect(validate(0)).toEqual({ isValid: true, value: 0 });
  });
});

describe("numberField - nonNegative validation", () => {
  test("Should reject negative numbers when nonNegative is true", () => {
    const validate = numberField("Amount", { nonNegative: true });

    expect(validate(10)).toEqual({ isValid: true, value: 10 });
    expect(validate(0)).toEqual({ isValid: true, value: 0 });
    expect(validate(-5)).toEqual({
      isValid: false,
      error: "Amount must be greater than or equal to 0",
    });
  });
});

describe("numberField - integer validation", () => {
  test("Should reject non-integers when integer is true", () => {
    const validate = numberField("Count", { integer: true });

    expect(validate(10)).toEqual({ isValid: true, value: 10 });
    expect(validate(10.5)).toEqual({
      isValid: false,
      error: "Count must be an integer",
    });
    expect(validate(0)).toEqual({ isValid: true, value: 0 });
    expect(validate(-5)).toEqual({ isValid: true, value: -5 });
  });

  test("Should accept decimals when integer is false (default)", () => {
    const validate = numberField("Price");
    expect(validate(10.5)).toEqual({ isValid: true, value: 10.5 });
  });
});

describe("numberField - min/max validation", () => {
  test("Should validate minimum value", () => {
    const validate = numberField("Age", { min: 18 });

    expect(validate(25)).toEqual({ isValid: true, value: 25 });
    expect(validate(18)).toEqual({ isValid: true, value: 18 });
    expect(validate(17)).toEqual({
      isValid: false,
      error: "Age must be at least 18",
    });
  });

  test("Should validate maximum value", () => {
    const validate = numberField("Score", { max: 100 });

    expect(validate(85)).toEqual({ isValid: true, value: 85 });
    expect(validate(100)).toEqual({ isValid: true, value: 100 });
    expect(validate(101)).toEqual({
      isValid: false,
      error: "Score must be at most 100",
    });
  });

  test("Should validate both min and max with combined message", () => {
    const validate = numberField("Percentage", { min: 0, max: 100 });

    expect(validate(50)).toEqual({ isValid: true, value: 50 });
    expect(validate(0)).toEqual({ isValid: true, value: 0 });
    expect(validate(100)).toEqual({ isValid: true, value: 100 });
    expect(validate(-1)).toEqual({
      isValid: false,
      error: "Percentage must be between 0 and 100",
    });
    expect(validate(101)).toEqual({
      isValid: false,
      error: "Percentage must be between 0 and 100",
    });
  });

  test("Should work with min and max separately", () => {
    const validate = numberField("Value", { min: 1, max: 10 });

    expect(validate(5)).toEqual({ isValid: true, value: 5 });
    expect(validate(1)).toEqual({ isValid: true, value: 1 });
    expect(validate(10)).toEqual({ isValid: true, value: 10 });
  });
});

describe("numberField - combined validations", () => {
  test("Should combine integer and positive", () => {
    const validate = numberField("Quantity", { integer: true, positive: true });

    expect(validate(5)).toEqual({ isValid: true, value: 5 });
    expect(validate(0)).toEqual({
      isValid: false,
      error: "Quantity must be greater than 0",
    });
    expect(validate(5.5)).toEqual({
      isValid: false,
      error: "Quantity must be an integer",
    });
    expect(validate(-3)).toEqual({
      isValid: false,
      error: "Quantity must be greater than 0",
    });
  });

  test("Should combine min, max, and integer", () => {
    const validate = numberField("Rating", {
      min: 1,
      max: 5,
      integer: true,
    });

    expect(validate(3)).toEqual({ isValid: true, value: 3 });
    expect(validate(1)).toEqual({ isValid: true, value: 1 });
    expect(validate(5)).toEqual({ isValid: true, value: 5 });
    expect(validate(0)).toEqual({
      isValid: false,
      error: "Rating must be between 1 and 5",
    });
    expect(validate(4.5)).toEqual({
      isValid: false,
      error: "Rating must be an integer",
    });
  });
});

describe("numberField - transform option", () => {
  test("Should apply transformation after validation", () => {
    const validate = numberField("Value", {
      transform: (value) => Math.round(value * 100) / 100, // Round to 2 decimals
    });

    expect(validate(10.456)).toEqual({ isValid: true, value: 10.46 });
    expect(validate(5.001)).toEqual({ isValid: true, value: 5 });
  });

  test("Should transform after all validations", () => {
    const validate = numberField("Value", {
      min: 0,
      max: 100,
      transform: (value) => Math.floor(value),
    });

    expect(validate(99.9)).toEqual({ isValid: true, value: 99 });
    expect(validate(0.1)).toEqual({ isValid: true, value: 0 });
  });
});

describe("numberField - custom error messages", () => {
  test("Should use custom required message", () => {
    const validate = numberField("Age", {
      requiredMessage: "Please enter your age",
    });

    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Please enter your age",
    });
  });

  test("Should use custom type message", () => {
    const validate = numberField("Age", {
      typeMessage: "Age should be a numeric value",
    });

    expect(validate("ten")).toEqual({
      isValid: false,
      error: "Age should be a numeric value",
    });
  });
});

describe("optionalNumber - wrapper function", () => {
  test("Should validate number when provided with only max", () => {
    const validate = optionalNumber("Score", { max: 100 });

    expect(validate(85)).toEqual({ isValid: true, value: 85 });
    expect(validate(150)).toEqual({
      isValid: false,
      error: "Score must be at most 100",
    });
  });

  test("Should validate number when provided with min and max", () => {
    const validate = optionalNumber("Score", { min: 0, max: 100 });

    expect(validate(85)).toEqual({ isValid: true, value: 85 });
    expect(validate(150)).toEqual({
      isValid: false,
      error: "Score must be between 0 and 100",
    });
    expect(validate(-10)).toEqual({
      isValid: false,
      error: "Score must be between 0 and 100",
    });
  });
});

describe("positiveNumber - backward compatibility", () => {
  test("Should work as before", () => {
    const validate = positiveNumber("Total");

    expect(validate(10)).toEqual({ isValid: true, value: 10 });
    expect(validate(0)).toEqual({
      isValid: false,
      error: "Total must be greater than 0",
    });
    expect(validate(-5)).toEqual({
      isValid: false,
      error: "Total must be greater than 0",
    });
  });

  test("Should accept additional options", () => {
    const validate = positiveNumber("Total", { integer: true });

    expect(validate(5)).toEqual({ isValid: true, value: 5 });
    expect(validate(5.5)).toEqual({
      isValid: false,
      error: "Total must be an integer",
    });
  });
});

describe("numberInRange - backward compatibility", () => {
  test("Should work as before", () => {
    const validate = numberInRange(1, 5, "Energy");

    expect(validate(3)).toEqual({ isValid: true, value: 3 });
    expect(validate(1)).toEqual({ isValid: true, value: 1 });
    expect(validate(5)).toEqual({ isValid: true, value: 5 });
    expect(validate(0)).toEqual({
      isValid: false,
      error: "Energy must be between 1 and 5",
    });
    expect(validate(10)).toEqual({
      isValid: false,
      error: "Energy must be between 1 and 5",
    });
  });

  test("Should accept additional options", () => {
    const validate = numberInRange(1, 100, "Percentage", { integer: true });

    expect(validate(50)).toEqual({ isValid: true, value: 50 });
    expect(validate(50.5)).toEqual({
      isValid: false,
      error: "Percentage must be an integer",
    });
  });
});

describe("edge cases", () => {
  test("Should reject NaN", () => {
    const validate = numberField("Value");

    expect(validate(NaN)).toEqual({
      isValid: false,
      error: "Value must be a number",
    });
  });

  test("Should reject Infinity", () => {
    const validate = numberField("Value");

    expect(validate(Infinity)).toEqual({
      isValid: false,
      error: "Value must be a number",
    });
  });

  test("Should reject -Infinity", () => {
    const validate = numberField("Value");

    expect(validate(-Infinity)).toEqual({
      isValid: false,
      error: "Value must be a number",
    });
  });

  test("Should handle very large finite numbers", () => {
    const validate = numberField("BigNumber");
    const bigNumber = Number.MAX_SAFE_INTEGER;

    expect(validate(bigNumber)).toEqual({ isValid: true, value: bigNumber });
  });

  test("Should handle very small finite numbers", () => {
    const validate = numberField("SmallNumber");
    const smallNumber = Number.MIN_VALUE;

    expect(validate(smallNumber)).toEqual({
      isValid: true,
      value: smallNumber,
    });
  });
  test("Should handle min = max as exact value", () => {
    const validate = numberField("FixedValue", { min: 10, max: 10 });

    expect(validate(10)).toEqual({ isValid: true, value: 10 });
    expect(validate(9)).toEqual({
      isValid: false,
      error: "FixedValue must be exactly 10",
    });
    expect(validate(11)).toEqual({
      isValid: false,
      error: "FixedValue must be exactly 10",
    });
  });

  test("Should handle negative min and max range", () => {
    const validate = numberField("Temperature", { min: -10, max: 10 });

    expect(validate(0)).toEqual({ isValid: true, value: 0 });
    expect(validate(-10)).toEqual({ isValid: true, value: -10 });
    expect(validate(10)).toEqual({ isValid: true, value: 10 });
    expect(validate(-11)).toEqual({
      isValid: false,
      error: "Temperature must be between -10 and 10",
    });
    expect(validate(11)).toEqual({
      isValid: false,
      error: "Temperature must be between -10 and 10",
    });
  });
});
