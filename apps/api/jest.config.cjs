/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },

  moduleNameMapper: {
    "^@learning-resource/domain$":
      "<rootDir>/../../learning-resource/domain/src",
    "^@learning-resource/application$":
      "<rootDir>/../../learning-resource/application/src",
    "^@pomodoro/domain$": "<rootDir>/../../pomodoro/domain/src",
    "^@pomodoro/application$": "<rootDir>/../../pomodoro/application/src",
    "^domain-lib$": "<rootDir>/../../shared/domain-lib/src",
    "^infrastructure-lib$": "<rootDir>/../../shared/infrastructure-lib/src",
    "^(\\.{1,2}/.+)\\.js$": "$1",
  },

  transformIgnorePatterns: [
    "node_modules/(?!(module-that-needs-transforming)/)",
  ],

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
  ],
  coverageDirectory: "./coverage",

  testTimeout: 30000,
};

module.exports = config;
