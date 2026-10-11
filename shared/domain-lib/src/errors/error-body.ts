import type { AnyBaseError } from "./base-error.js";

type ContextOf<E extends AnyBaseError> = E["context"] extends undefined ? unknown : E["context"];

export type ErrorBody<E extends AnyBaseError> = { error: E["name"] } & ContextOf<E>;

export const toErrorBody = <E extends AnyBaseError>(error: E): ErrorBody<E> =>
  ({ error: error.name, ...error.context }) as ErrorBody<E>;
