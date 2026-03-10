export type UseCaseErrors<T extends Record<string, (...args: any[]) => any>> =
  T[keyof T] extends (...args: any[]) => Promise<infer R>
    ? Exclude<R, void | undefined>
    : never;
