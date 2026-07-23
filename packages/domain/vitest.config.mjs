export default {
  test: {
    exclude: ["**/.stryker-tmp/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/pricing/**/*.ts"],
      exclude: [
        "src/pricing/index.ts",
        "src/pricing/types.ts",
        "src/pricing/canonical.ts",
      ],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 90 },
    },
  },
};
