import { describe, test, expectTypeOf } from "vitest";
import type { UseCaseErrors } from "./use-case-errors.js";
import type { InvalidDataError } from "./generic-errors/invalid-data-error.js";
import type { NotFoundError } from "./generic-errors/not-found-error.js";

describe("UseCaseErrors", () => {
  test("Extract error types from use case return types", () => {
    type FakeUseCases = {
      doSomething: () => Promise<void | InvalidDataError>;
      findSomething: () => Promise<NotFoundError | undefined>;
    };

    expectTypeOf<UseCaseErrors<FakeUseCases>>().toEqualTypeOf<
      InvalidDataError | NotFoundError
    >;
  });

  test("Excludes void and undefined from union", () => {
    type FakeUseCases = {
      doSomething: () => Promise<void | InvalidDataError>;
    };

    expectTypeOf<UseCaseErrors<FakeUseCases>>().not.toExtend<undefined>();
    expectTypeOf<UseCaseErrors<FakeUseCases>>().not.toExtend<void>();
  });
  test("Excludes response models from union", () => {
    type FakeUseCases = {
      getById: () => Promise<{ id: string } | InvalidDataError>;
    };

    expectTypeOf<
      UseCaseErrors<FakeUseCases>
    >().toEqualTypeOf<InvalidDataError>();
  });
  test("handles synchronous use cases", () => {
    type FakeUseCases = {
      syncUseCase: () => InvalidDataError | void;
      asyncUseCase: () => Promise<NotFoundError | void>;
    };

    expectTypeOf<UseCaseErrors<FakeUseCases>>().toEqualTypeOf<
      InvalidDataError | NotFoundError
    >();
  });
});
