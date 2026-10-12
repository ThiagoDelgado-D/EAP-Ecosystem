export type ErrorContext = Record<string, unknown>;

type ContextArgs<TContext> = [TContext] extends [undefined] ? [] : [context: TContext];

export abstract class BaseError<
  TName extends string = string,
  TContext extends ErrorContext | undefined = undefined,
> extends Error {
  public override name: TName;
  public statusCode: number;
  public context: TContext;

  constructor(name: TName, statusCode: number, ...[context]: ContextArgs<TContext>) {
    super();
    this.name = name;
    this.statusCode = statusCode;
    this.context = context as TContext;
  }
}

export type AnyBaseError = BaseError<string, ErrorContext | undefined>;
