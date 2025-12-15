import { describe, test, expect } from "vitest";
import { objectField } from "./object-validator";
import { positiveNumber } from "./number-field";
import { requiredBoolean } from "./boolean-validator";
import type { StrictFieldValidator } from "../validation-schema";

describe("objectField", () => {
  const validateDuration = objectField<{
    value: number;
    isEstimated: boolean;
  }>("Duration", {
    value: positiveNumber("Duration.value"),
    isEstimated: requiredBoolean("Duration.isEstimated"),
  });

  test("Should fail when value is not an object", () => {
    const validate = objectField("Payload");

    const invalidCases = [
      null,
      undefined,
      123,
      "str",
      false,
      true,
      [],
      () => {},
    ];

    for (const c of invalidCases) {
      expect(validate(c)).toEqual({
        isValid: false,
        error: "Payload must be an object",
      });
    }
  });

  test("Should use default field name when not provided", () => {
    const defaultValidator = objectField<{ x: number }>(undefined, {
      x: positiveNumber("x"),
    });

    const result = defaultValidator("not-object");

    expect(result).toEqual({
      isValid: false,
      error: "Object must be an object",
    });
  });

  test("Should use default field name when none is provided", () => {
    const validate = objectField();

    const result = validate(123);

    expect(result).toEqual({
      isValid: false,
      error: "Object must be an object",
    });
  });

  test("Should accept a valid object when no validators are provided", () => {
    const validate = objectField("Payload");

    const result = validate({ a: 1, b: 2 });

    expect(result).toEqual({
      isValid: true,
      value: { a: 1, b: 2 },
    });
  });

  test("Should validate inner fields using provided validators", () => {
    const mockValidator: StrictFieldValidator<string> = () => ({
      isValid: true,
      value: "ok",
    });

    const validate = objectField<{ name: string }>("User", {
      name: mockValidator,
    });

    const result = validate({ name: "John" });

    expect(result).toEqual({
      isValid: true,
      value: { name: "John" },
    });
  });

  test("Should fail when an inner validator fails", () => {
    const failingValidator: StrictFieldValidator<string> = () => ({
      isValid: false,
      error: "Invalid string",
    });

    const validate = objectField<{ name: string }>("User", {
      name: failingValidator,
    });

    const result = validate({ name: 123 });

    expect(result).toEqual({
      isValid: false,
      error: "User.name: Invalid string",
    });
  });

  test("Should return valid when all inner validators pass", () => {
    const stringValidator: StrictFieldValidator<string> = (v) =>
      typeof v === "string"
        ? { isValid: true, value: v }
        : { isValid: false, error: "Must be string" };

    const numberValidator: StrictFieldValidator<number> = (v) =>
      typeof v === "number"
        ? { isValid: true, value: v }
        : { isValid: false, error: "Must be number" };

    const validate = objectField<{
      name: string;
      age: number;
    }>("User", {
      name: stringValidator,
      age: numberValidator,
    });

    const result = validate({ name: "Alice", age: 25 });

    expect(result).toEqual({
      isValid: true,
      value: { name: "Alice", age: 25 },
    });
  });

  test("Should skip undefined inner validators", () => {
    const validate = objectField<{ name: string; age: number }>("User", {
      name: undefined,
      age: positiveNumber("age"),
    });

    const result = validate({ name: "Alice", age: 30 });

    expect(result).toEqual({
      isValid: true,
      value: { name: "Alice", age: 30 },
    });
  });

  test("Should validate a correct Duration object", () => {
    const result = validateDuration({ value: 120, isEstimated: true });

    expect(result).toEqual({
      isValid: true,
      value: { value: 120, isEstimated: true },
    });
  });

  test("Should fail when value is not an object (Duration)", () => {
    const cases = [null, undefined, 123, "abc", [], true];

    for (const c of cases) {
      const result = validateDuration(c);
      expect(result).toEqual({
        isValid: false,
        error: "Duration must be an object",
      });
    }
  });

  test("Should fail when a nested field is invalid (value not a number)", () => {
    const result = validateDuration({ value: "x", isEstimated: false });

    expect(result).toEqual({
      isValid: false,
      error: "Duration.value: Duration.value must be a number",
    });
  });

  test("Should fail when a nested field is invalid (boolean expected)", () => {
    const result = validateDuration({ value: 10, isEstimated: "yes" });

    expect(result).toEqual({
      isValid: false,
      error: "Duration.isEstimated: Duration.isEstimated must be a boolean",
    });
  });
});
