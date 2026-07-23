/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  plugins: [],
  mutate: ["src/pricing/calculate-quote.ts:129-172"],
  testRunner: "command",
  commandRunner: { command: "npm test" },
  coverageAnalysis: "off",
  ignorePatterns: [".stryker-tmp/**"],
  reporters: ["clear-text", "progress", "html"],
  thresholds: { high: 90, low: 80, break: 80 },
  timeoutMS: 10000,
  concurrency: 1,
};
