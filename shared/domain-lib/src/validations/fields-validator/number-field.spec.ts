import { expect, test, describe } from "vitest";
import { numberField } from "./number-field";

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
