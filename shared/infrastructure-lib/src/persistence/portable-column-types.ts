// Entity decorators run at import time, so the engine has to be known from the
// process environment before any entity module loads.
const isSqlite = () => process.env.DB_TYPE === "sqlite";

export const timestampType = () => (isSqlite() ? "datetime" : "timestamp");

export const timestamptzType = () => (isSqlite() ? "datetime" : "timestamptz");

export const jsonType = () => (isSqlite() ? "simple-json" : "jsonb");

export const textArrayColumn = (defaultValues: string[]) => {
  if (isSqlite()) {
    return { type: "simple-json", default: JSON.stringify(defaultValues) } as const;
  }

  return { type: "text", array: true, default: `{${defaultValues.join(",")}}` } as const;
};
