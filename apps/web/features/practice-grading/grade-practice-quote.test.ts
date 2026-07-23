import { describe, expect, it } from "vitest";
import { calculateQuote, PRICING_2026_06_30, type QuoteInput } from "@mercurius/domain";
import { gradePracticeQuote } from "./grade-practice-quote";

const dental: QuoteInput = {
  coreCode: "SPARK",
  enhancementCodes: ["AI_MARKETING_COPILOT"],
  adSpendCents: 0,
};
const wellness: QuoteInput = {
  coreCode: "INSIGHT",
  enhancementCodes: ["RETENTION_ENGINE", "SOCIAL_COMMAND"],
  adSpendCents: 0,
};

function grade(submittedInput: QuoteInput, expectedInput: QuoteInput) {
  return gradePracticeQuote({
    submittedInput,
    expectedInput,
    submittedCalculation: calculateQuote(submittedInput, PRICING_2026_06_30),
    expectedCalculation: calculateQuote(expectedInput, PRICING_2026_06_30),
  });
}

describe("gradePracticeQuote", () => {
  it.each([
    ["dental", dental],
    ["wellness", wellness],
  ])("awards a perfect score for the %s scenario answer", (_name, expected) => {
    const result = grade(expected, expected);
    expect(result.score).toBe(100);
    expect(result.level).toBe("perfect");
    expect(result.mistakes).toEqual([]);
  });

  it("identifies an incorrect core, missing enhancement, and extra enhancement", () => {
    const result = grade({
      coreCode: "SPARK_PRO",
      enhancementCodes: ["SOCIAL_COMMAND"],
      adSpendCents: 0,
    }, wellness);

    expect(result.score).toBeLessThan(80);
    expect(result.mistakes).toEqual(expect.arrayContaining([
      expect.stringContaining("Core package"),
      expect.stringContaining("Missing enhancement: Retention Engine"),
      expect.stringContaining("Monthly total"),
    ]));
    expect(result.coachingNotes.length).toBeGreaterThan(0);
  });
});
