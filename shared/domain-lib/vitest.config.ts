import { defineConfig, mergeConfig } from "vitest/config";
import { baseNodeVitestConfig } from "./src/testing/vitest-node-config.js";

export default mergeConfig(
  baseNodeVitestConfig({
    excludeMocks: false,
    extraCoverageExcludes: ["src/errors/generic-errors/**/*"],
  }),
  defineConfig({
    test: {
      name: "domain-lib",
    },
  }),
);
