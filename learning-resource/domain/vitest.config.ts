import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    name: "learning-resource-domain",
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
      ],
      reporter: ["text", "json", "html"],
    },
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "domain-lib": resolve(__dirname, "../../shared/domain-lib/src"),
    },
  },
});
