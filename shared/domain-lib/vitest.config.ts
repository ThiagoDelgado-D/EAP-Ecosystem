import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "domain-lib",
    root: "./",
    globals: true,
    environment: "node",
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      exclude: [
        "**/index.ts",
        "src/errors/generic-errors/**/*",
        "dist/**",
        "node_modules/**",
        "**/*.spec.ts",
        "**/*.test.ts",
      ],
      reporter: ["text", "json", "html"],
    },
    passWithNoTests: true,
  },
});
