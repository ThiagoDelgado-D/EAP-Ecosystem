import { defineConfig } from "vitest/config";

export const baseNodeVitestConfig = defineConfig({
  test: {
    root: "./",
    globals: true,
    environment: "node",
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      exclude: [
        "**/index.ts",
        "dist/**",
        "node_modules/**",
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/mocks/**",
      ],
      reporter: ["text", "json", "html"],
    },
    passWithNoTests: true,
  },
});
