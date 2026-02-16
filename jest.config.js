/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
  ],
  testTimeout: 10000,
};
