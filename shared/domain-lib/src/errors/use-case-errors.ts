import type { BaseError } from "./base-error.js";

export type UseCaseErrors<T extends Record<string, (...args: any[]) => any>> =
  T[keyof T] extends (...args: any[]) => Promise<infer R>
    ? Extract<Exclude<R, void | undefined>, BaseError>
    : never;
