import { describe, expect, test } from "vitest";
import { sanitizeString } from "./sanitize-string.js";

describe("sanitizeString", () => {
  test("Should trim leading and trailing spaces", () => {
    expect(sanitizeString("  Hello World  ")).toBe("Hello World");
  });

  test("Should remove control characters", () => {
    expect(sanitizeString("Hello\u0000World\u001F!")).toBe("HelloWorld!");
  });

  test("Should collapse multiple spaces to a single space by default", () => {
    expect(sanitizeString("Hello   World  Test")).toBe("Hello World Test");
  });

  test("Should not collapse spaces if collapseSpaces=false", () => {
    expect(sanitizeString("Hello   World", { collapseSpaces: false })).toBe(
      "Hello   World"
    );
  });

  test("Should convert to lower case if toLowerCase=true", () => {
    expect(sanitizeString("HeLLo WoRLD", { toLowerCase: true })).toBe(
      "hello world"
    );
  });

  test("Should combine options correctly", () => {
    expect(
      sanitizeString("   TeSt\u0001 String  ", {
        toLowerCase: true,
        collapseSpaces: true,
      })
    ).toBe("test string");
  });

  test("Should normalize Unicode characters", () => {
    const composed = "é"; // U+00E9
    const decomposed = "e\u0301"; // e + ´
    expect(sanitizeString(decomposed)).toBe(composed);
  });
});
