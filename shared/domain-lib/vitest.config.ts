import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      exclude: ["**/index.ts", "src/errors/generic-errors/**/*"],
    },
    passWithNoTests: true,
  },
});
