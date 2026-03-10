import { HttpException } from "@nestjs/common";
import { InvalidDataError, NotFoundError, ValidationError } from "domain-lib";
import { LearningResourceNotFoundError } from "@learning-resource/application";
import { toHttpException } from "./domain-error-mapper.js";

describe("toHttpException", () => {
  test("maps InvalidDataError to 400", () => {
    const error = new InvalidDataError({ field: "required" });
    expect(() => toHttpException(error)).toThrow(HttpException);
    expect(() => toHttpException(error)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });
  test("maps ValidationError to 400", () => {
    const error = new ValidationError({ field: "invalid" }, null);
    expect(() => toHttpException(error)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });
  test("maps NotFoundError to 404", () => {
    const error = new NotFoundError({ resource: "Topic", id: "123" });
    expect(() => toHttpException(error)).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  test("maps LearningResourceNotFoundError to 404", () => {
    const error = new LearningResourceNotFoundError();
    expect(() => toHttpException(error)).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  test("passes error context as response body", () => {
    const context = { field: "required" };
    const error = new InvalidDataError(context);
    expect(() => toHttpException(error)).toThrow(
      expect.objectContaining({ response: context }),
    );
  });

  test("uses empty object when context is undefined", () => {
    const error = new LearningResourceNotFoundError();
    expect(() => toHttpException(error)).toThrow(
      expect.objectContaining({ response: {} }),
    );
  });
});
