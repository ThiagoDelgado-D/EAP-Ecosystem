export abstract class BaseError<TName extends string> extends Error {
  public name: TName;
  public statusCode: number;
  public context?: Record<string, unknown>;

  constructor(
    name: TName,
    statusCode: number,
    context?: Record<string, unknown>
  ) {
    super();
    this.name = name;
    this.statusCode = statusCode;
    this.context = context;
  }
}
