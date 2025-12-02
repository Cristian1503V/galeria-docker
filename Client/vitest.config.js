import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: ["node_modules/", "dist/", "**/*.config.js", "**/*.d.ts"],
    },
    include: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  },
});
