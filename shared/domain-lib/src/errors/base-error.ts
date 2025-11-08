export abstract class BaseError<TName extends string> extends Error {
  name: TName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any;

  constructor(name: TName) {
    super();
    this.name = name;
  }

  toString(): TName {
    return this.name;
  }
}
