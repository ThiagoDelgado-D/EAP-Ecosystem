import { defineConfig } from "vitest/config";

export interface BaseNodeVitestConfigOptions {
  excludeMocks?: boolean;
  extraCoverageExcludes?: string[];
}

export const baseNodeVitestConfig = (
  options: BaseNodeVitestConfigOptions = {},
) => {
  const { excludeMocks = true, extraCoverageExcludes = [] } = options;

  return defineConfig({
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
          ...(excludeMocks ? ["**/mocks/**"] : []),
          ...extraCoverageExcludes,
        ],
        reporter: ["text", "json", "html"],
      },
      passWithNoTests: true,
    },
  });
};
