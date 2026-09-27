import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "node:path";
import { baseNodeVitestConfig } from "../domain-lib/src/testing/index.js";

export default mergeConfig(
  baseNodeVitestConfig({ excludeMocks: false }),
  defineConfig({
    test: {
      name: "infrastructure-lib",
    },
    resolve: {
      alias: {
        "domain-lib": resolve(__dirname, "../domain-lib/src"),
      },
    },
  }),
);
