import { describe, test, expect } from "vitest";
import { nonEmptyArray } from "./array-validator";

describe("nonEmptyArray", () => {
  const validate = nonEmptyArray("Items");

  test("Should accept a non-empty array", () => {
    const result = validate([1, 2, 3]);
    expect(result).toEqual({
      isValid: true,
      value: [1, 2, 3],
    });
  });

  test("Should return error when value is not an array", () => {
    const result = validate("not-array");
    expect(result).toEqual({
      isValid: false,
      error: "Items must be an array",
    });
  });

  test("Should return error when value is not an array (multiple invalid cases)", () => {
    const cases = [
      null,
      undefined,
      {},
      123,
      "abc",
      false,
      true,
      new Array("x"),
    ];

    for (const c of cases) {
      if (Array.isArray(c)) continue;

      const result = validate(c);
      expect(result).toEqual({
        isValid: false,
        error: "Items must be an array",
      });
    }
  });

  test("Should return error when array is empty", () => {
    const result = validate([]);
    expect(result).toEqual({
      isValid: false,
      error: "Items must contain at least one item",
    });
  });

  test("Should accept arrays with any type of items", () => {
    const result = validate([null, undefined, {}, "x"]);
    expect(result).toEqual({
      isValid: true,
      value: [null, undefined, {}, "x"],
    });
  });

  test("Should use default field name when not provided", () => {
    const defaultValidate = nonEmptyArray();
    const result = defaultValidate(123);

    expect(result).toEqual({
      isValid: false,
      error: "Array must be an array",
    });
  });
});
