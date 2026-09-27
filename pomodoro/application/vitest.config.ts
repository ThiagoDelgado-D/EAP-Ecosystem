import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "node:path";
import { baseNodeVitestConfig } from "../../shared/domain-lib/src/testing/index.js";

export default mergeConfig(
  baseNodeVitestConfig,
  defineConfig({
    test: {
      name: "pomodoro-application",
    },
    resolve: {
      alias: {
        "domain-lib": resolve(__dirname, "../../shared/domain-lib/src"),
        "@pomodoro/domain": resolve(__dirname, "../domain/src"),
      },
    },
  }),
);
