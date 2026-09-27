import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "node:path";
import { baseNodeVitestConfig } from "../../shared/domain-lib/src/testing/index.js";

export default mergeConfig(
  baseNodeVitestConfig(),
  defineConfig({
    test: {
      name: "learning-resource-application",
    },
    resolve: {
      alias: {
        "domain-lib": resolve(__dirname, "../../shared/domain-lib/src"),
        "@learning-resource/domain": resolve(__dirname, "../domain/src"),
      },
    },
  }),
);
