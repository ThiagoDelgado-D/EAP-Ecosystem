import { describe, expect, test } from "vitest";
import { isError } from "./is-error.js";
import { UnexpectedError } from "./generic-errors/index.js";

describe("is-error", () => {
  test("Given an error, should return true", () => {
    const error = new UnexpectedError();
    const result = isError(error);
    expect(result).toBe(true);
  });
  test("Given an not error, should return false", () => {
    const result = isError("error");
    expect(result).toBe(false);
  });
});
