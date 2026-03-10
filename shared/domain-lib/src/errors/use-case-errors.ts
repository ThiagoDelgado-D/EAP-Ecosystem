import type { BaseError } from "./base-error.js";

type UnwrapReturn<R> = R extends Promise<infer U> ? U : R;

export type UseCaseErrors<T extends Record<string, (...args: any[]) => any>> =
  T[keyof T] extends (...args: any[]) => infer R
    ? Extract<Exclude<UnwrapReturn<R>, void | undefined>, BaseError>
    : never;
