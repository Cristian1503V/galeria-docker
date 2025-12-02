import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",

      include: ["src/utils/**/*.js"],

      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.js",
        "**/*.config.mjs",
        "**/*.d.ts",
        "**/__tests__/**",
        "**/*.test.js",
        "**/*.spec.js",
        "src/pages/**",
        "src/components/**/*.astro",
        "src/env.d.ts",
      ],
    },
    include: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  },
});
