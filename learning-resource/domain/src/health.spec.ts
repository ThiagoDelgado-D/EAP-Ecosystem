import { describe, expect, test } from "vitest";
import { healthCheck } from "./health.js";

describe("healthCheck", () => {
  test("should return ok status", () => {
    const result = healthCheck();
    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});
