import type { AppDomainError, AppErrorName } from './app-domain-error';

export const NETWORK_ERROR = 'NETWORK_ERROR';

export type ApiErrorName = AppErrorName | typeof NETWORK_ERROR;

type ContextByName = { [E in AppDomainError as E['name']]: E['context'] } & {
  [NETWORK_ERROR]: undefined;
};

export type ApiErrorContext<N extends ApiErrorName> = ContextByName[N];

export class ApiError<N extends ApiErrorName = ApiErrorName> extends Error {
  override readonly name: N;

  constructor(
    name: N,
    readonly status: number,
    readonly context: ApiErrorContext<N>,
  ) {
    super(name);
    this.name = name;
  }
}

export type AnyApiError = { [N in ApiErrorName]: ApiError<N> }[ApiErrorName];

export function isApiError(error: unknown): error is AnyApiError {
  return error instanceof ApiError;
}
