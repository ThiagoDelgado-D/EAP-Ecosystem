import type { BaseError } from "./base-error.js";

export type UseCaseErrors<T extends Record<string, (...args: any[]) => any>> =
  T[keyof T] extends (...args: any[]) => infer R
    ? Extract<
        Exclude<R extends Promise<infer U> ? U : R, void | undefined>,
        BaseError
      >
    : never;
