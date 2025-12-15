import { expect, test, describe } from "vitest";
import { numberInRange, positiveNumber } from "./number-field";

describe("positiveNumber", () => {
  const validate = positiveNumber("Total");

  test("Should accept a valid positive number", () => {
    const result = validate(10);
    expect(result).toEqual({ isValid: true, value: 10 });
  });

  test("Should return error when value is not a number", () => {
    const result = validate("10" as unknown);

    expect(result).toEqual({
      isValid: false,
      error: "Total must be a number",
    });
  });

  test("Should return error when value is not a number (multiple cases)", () => {
    const cases = [null, undefined, {}, [], false, true, "abc", new Number(5)];

    for (const c of cases) {
      const result = validate(c);
      expect(result).toEqual({
        isValid: false,
        error: "Total must be a number",
      });
    }
  });

  test("Should return error when value is negative", () => {
    const result = validate(-3);
    expect(result).toEqual({
      isValid: false,
      error: "Total must be greater than 0",
    });
  });

  test("Should use default field name when not provided", () => {
    const defaultValidate = positiveNumber();
    const result = defaultValidate("x");

    expect(result).toEqual({
      isValid: false,
      error: "Number must be a number",
    });
  });
});

describe("numberInRange", () => {
  const validate = numberInRange(1, 5, "Energy");

  test("Should accept a number inside the range", () => {
    const result = validate(3);
    expect(result).toEqual({ isValid: true, value: 3 });
  });

  test("Should accept boundary values (min)", () => {
    const result = validate(1);
    expect(result).toEqual({ isValid: true, value: 1 });
  });

  test("Should accept boundary values (max)", () => {
    const result = validate(5);
    expect(result).toEqual({ isValid: true, value: 5 });
  });

  test("Should return error when value is not a number", () => {
    const result = validate("3");
    expect(result).toEqual({
      isValid: false,
      error: "Energy must be a number",
    });
  });

  test("Should return error when value is not a number (multiple cases)", () => {
    const cases = [null, undefined, {}, [], false, true, "abc", new Number(2)];

    for (const c of cases) {
      const result = validate(c);
      expect(result).toEqual({
        isValid: false,
        error: "Energy must be a number",
      });
    }
  });

  test("Should return error when number is below min", () => {
    const result = validate(0);
    expect(result).toEqual({
      isValid: false,
      error: "Energy must be between 1 and 5",
    });
  });

  test("Should return error when number is above max", () => {
    const result = validate(10);
    expect(result).toEqual({
      isValid: false,
      error: "Energy must be between 1 and 5",
    });
  });

  test("Should use default field name when not provided", () => {
    const defaultValidate = numberInRange(10, 20);
    const result = defaultValidate("x");

    expect(result).toEqual({
      isValid: false,
      error: "Number must be a number",
    });
  });
});
