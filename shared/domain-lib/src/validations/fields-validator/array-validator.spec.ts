import { describe, test, expect } from "vitest";
import { arrayField, optionalArray } from "./array-validator.js";

describe("arrayField - basic validations (required by default)", () => {
  const validate = arrayField("Items");

  test("Should validate a non-empty array", () => {
    const array = [1, 2, 3];
    expect(validate(array)).toEqual({
      isValid: true,
      value: array,
    });
  });

  test("Should accept empty array by default", () => {
    expect(validate([])).toEqual({
      isValid: true,
      value: [],
    });
  });

  test("Should reject null and undefined with 'is required' message", () => {
    expect(validate(null)).toEqual({
      isValid: false,
      error: "Items is required",
    });

    expect(validate(undefined)).toEqual({
      isValid: false,
      error: "Items is required",
    });
  });

  test("Should reject non-array values with 'must be an array' message", () => {
    const invalidCases = ["not-array", {}, 123, true, false, new Date(), "abc"];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "Items must be an array",
      });
    }
  });

  test("Should accept arrays created with Array constructor", () => {
    expect(validate(new Array("x"))).toEqual({
      isValid: true,
      value: ["x"],
    });

    expect(validate(Array.of(1, 2, 3))).toEqual({
      isValid: true,
      value: [1, 2, 3],
    });
  });

  test("Should use default field name when not provided", () => {
    const validate = arrayField();
    expect(validate("not-array")).toEqual({
      isValid: false,
      error: "Array must be an array",
    });
  });
});

describe("arrayField - minLength constraint", () => {
  test("Should reject array shorter than minLength", () => {
    const validate = arrayField("Tags", { minLength: 3 });

    expect(validate([1, 2])).toEqual({
      isValid: false,
      error: "Tags must contain at least 3 items",
    });
  });

  test("Should accept array meeting minLength", () => {
    const validate = arrayField("Tags", { minLength: 2 });
    const array = [1, 2];

    expect(validate(array)).toEqual({
      isValid: true,
      value: array,
    });

    expect(validate([1, 2, 3])).toEqual({
      isValid: true,
      value: [1, 2, 3],
    });
  });

  test("Should use singular form for minLength=1", () => {
    const validate = arrayField("Items", { minLength: 1 });

    expect(validate([])).toEqual({
      isValid: false,
      error: "Items must contain at least 1 item",
    });
  });
});

describe("arrayField - maxLength constraint", () => {
  test("Should reject array longer than maxLength", () => {
    const validate = arrayField("SelectedItems", { maxLength: 3 });

    expect(validate([1, 2, 3, 4])).toEqual({
      isValid: false,
      error: "SelectedItems must contain at most 3 items",
    });
  });

  test("Should accept array within maxLength", () => {
    const validate = arrayField("SelectedItems", { maxLength: 3 });
    const array = [1, 2];

    expect(validate(array)).toEqual({
      isValid: true,
      value: array,
    });

    expect(validate([1, 2, 3])).toEqual({
      isValid: true,
      value: [1, 2, 3],
    });
  });

  test("Should use singular form for maxLength=1", () => {
    const validate = arrayField("PrimaryItem", { maxLength: 1 });

    expect(validate([1, 2])).toEqual({
      isValid: false,
      error: "PrimaryItem must contain at most 1 item",
    });
  });
});

describe("arrayField - combined min and max constraints", () => {
  test("Should validate array within range", () => {
    const validate = arrayField("Choices", {
      minLength: 2,
      maxLength: 4,
    });

    expect(validate([1, 2])).toEqual({
      isValid: true,
      value: [1, 2],
    });

    expect(validate([1, 2, 3, 4])).toEqual({
      isValid: true,
      value: [1, 2, 3, 4],
    });
  });
});

describe("arrayField - optional arrays", () => {
  const validate = arrayField("OptionalItems", { required: false });

  test("Should accept null and undefined for optional arrays", () => {
    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should accept empty array for optional field", () => {
    expect(validate([])).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate non-empty array when provided", () => {
    const array = [1, 2, 3];
    expect(validate(array)).toEqual({
      isValid: true,
      value: array,
    });
  });
});

describe("arrayField - itemValidator", () => {
  test("Should validate each array item", () => {
    const validate = arrayField("Numbers", {
      itemValidator: (item, index) => {
        if (typeof item !== "number") {
          return {
            isValid: false,
            error: `Item at position ${index} must be a number`,
          };
        }
        return { isValid: true, value: item };
      },
    });

    expect(validate([1, 2, 3])).toEqual({
      isValid: true,
      value: [1, 2, 3],
    });

    expect(validate([1, "two", 3])).toEqual({
      isValid: false,
      error: "Numbers[1]: Item at position 1 must be a number",
    });
  });

  test("Should stop at first invalid item", () => {
    const validate = arrayField("Items", {
      itemValidator: (item) => {
        if (typeof item !== "string") {
          return { isValid: false, error: "Must be string" };
        }
        return { isValid: true, value: item };
      },
    });

    const result = validate([1, 2, 3]);
    expect(result).toEqual({
      isValid: false,
      error: "Items[0]: Must be string",
    });
  });
});

describe("arrayField - transform option", () => {
  test("Should apply transformation after validation", () => {
    const validate = arrayField<number>("Numbers", {
      transform: (arr) => arr.map((n) => n * 2),
    });

    expect(validate([1, 2, 3])).toEqual({
      isValid: true,
      value: [2, 4, 6],
    });
  });

  test("Should apply transformation with item validation", () => {
    const validate = arrayField<number>("Numbers", {
      itemValidator: (item) => {
        if (typeof item !== "number") {
          return { isValid: false, error: "Must be number" };
        }
        return { isValid: true, value: item };
      },
      transform: (arr) => arr.sort((a, b) => a - b),
    });

    expect(validate([3, 1, 2])).toEqual({
      isValid: true,
      value: [1, 2, 3],
    });
  });
});

describe("optionalArray - function", () => {
  test("Should return undefined for null/undefined", () => {
    const validate = optionalArray("SecondaryItems");

    expect(validate(null)).toEqual({
      isValid: true,
      value: undefined,
    });

    expect(validate(undefined)).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should return undefined for empty array", () => {
    const validate = optionalArray("SecondaryItems");

    expect(validate([])).toEqual({
      isValid: true,
      value: undefined,
    });
  });

  test("Should validate array when provided", () => {
    const validate = optionalArray("SelectedOptions");
    const array = [1, 2, 3];

    expect(validate(array)).toEqual({
      isValid: true,
      value: array,
    });

    expect(validate("not-array")).toEqual({
      isValid: false,
      error: "SelectedOptions must be an array",
    });
  });

  test("Should work with constraints for optional arrays", () => {
    const validate = optionalArray("Tags", { minLength: 2 });

    expect(validate([1])).toEqual({
      isValid: false,
      error: "Tags must contain at least 2 items",
    });

    expect(validate([1, 2])).toEqual({
      isValid: true,
      value: [1, 2],
    });
  });
});
