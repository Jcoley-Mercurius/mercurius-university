import { describe, expect, it } from "vitest";
import {
  PRICING_2026_06_30,
  PricingError,
  calculateQuote,
  type QuoteInput,
} from "@mercurius/domain/pricing";

const q = (overrides: Partial<QuoteInput> = {}): QuoteInput => ({
  coreCode: "SPARK",
  enhancementCodes: [],
  adSpendCents: 0,
  ...overrides,
});

const line = (
  result: ReturnType<typeof calculateQuote>,
  code: string,
) => result.lines.find((candidate) => candidate.productCode === code)!;

describe("Mercurius Pricing Reference Sheet 2026-06-30", () => {
  it.each([
    ["FREE", 0, 0],
    ["SPARK", 99_900, 9_900],
    ["SPARK_PRO", 150_000, 39_900],
    ["INSIGHT", 250_000, 59_900],
    ["INTELLIGENCE", 450_000, 99_900],
    ["INTELLIGENCE_PRO", 650_000, 149_900],
  ] as const)("seeds exact %s core pricing", (coreCode, setup, monthly) => {
    const result = calculateQuote(q({ coreCode }), PRICING_2026_06_30);
    expect(line(result, coreCode)).toMatchObject({
      listSetupCents: setup,
      listMonthlyCents: monthly,
      finalSetupCents: setup,
      finalMonthlyCents: monthly,
      appliedDiscountBps: 0,
    });
  });

  it.each([
    ["AI_MARKETING_COPILOT", "software", 14_900],
    ["VISIBILITY_ACCELERATOR", "software", 17_900],
    ["RETENTION_ENGINE", "software", 17_900],
    ["LEAD_VELOCITY", "software", 24_900],
    ["SOCIAL_COMMAND", "service", 29_900],
    ["VIDEO_VELOCITY", "service", 59_700],
    ["CONTENT_COMMAND_SUITE", "service", 79_700],
    ["ADS_COMMAND", "ads", 149_700],
  ] as const)("seeds exact %s enhancement pricing", (code, classification, monthly) => {
    const result = calculateQuote(
      q({
        coreCode: "FREE",
        enhancementCodes: [code],
        adSpendCents: code === "ADS_COMMAND" ? 1 : 0,
      }),
      PRICING_2026_06_30,
    );
    expect(line(result, code)).toMatchObject({
      classification,
      listMonthlyCents: monthly,
      finalMonthlyCents: monthly,
    });
  });

  it.each([
    ["FREE", 0, 14_900],
    ["SPARK", 500, 14_155],
    ["SPARK_PRO", 1_000, 13_410],
    ["INSIGHT", 1_200, 13_112],
    ["INTELLIGENCE", 1_800, 12_218],
    ["INTELLIGENCE_PRO", 2_000, 11_920],
  ] as const)(
    "applies exact %s software tier discount",
    (coreCode, tierDiscountBps, finalMonthlyCents) => {
      const result = calculateQuote(
        q({ coreCode, enhancementCodes: ["AI_MARKETING_COPILOT"] }),
        PRICING_2026_06_30,
      );
      expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
        tierDiscountBps,
        bundleDiscountBps: 0,
        finalMonthlyCents,
      });
    },
  );

  it.each([
    ["FREE", 0, 29_900],
    ["SPARK", 1_000, 26_910],
    ["SPARK_PRO", 1_000, 26_910],
    ["INSIGHT", 1_000, 26_910],
    ["INTELLIGENCE", 1_200, 26_312],
    ["INTELLIGENCE_PRO", 1_500, 25_415],
  ] as const)(
    "applies exact %s non-Ads service cap",
    (coreCode, tierDiscountBps, finalMonthlyCents) => {
      const result = calculateQuote(
        q({ coreCode, enhancementCodes: ["SOCIAL_COMMAND"] }),
        PRICING_2026_06_30,
      );
      expect(line(result, "SOCIAL_COMMAND")).toMatchObject({
        tierDiscountBps,
        bundleDiscountBps: 0,
        appliedDiscountBps: tierDiscountBps,
        finalMonthlyCents,
      });
    },
  );

  it.each([
    [["AI_MARKETING_COPILOT"], 0, 14_900],
    [["AI_MARKETING_COPILOT", "SOCIAL_COMMAND"], 1_000, 13_410],
    [
      ["AI_MARKETING_COPILOT", "SOCIAL_COMMAND", "VIDEO_VELOCITY"],
      1_500,
      12_665,
    ],
    [
      [
        "AI_MARKETING_COPILOT",
        "SOCIAL_COMMAND",
        "VIDEO_VELOCITY",
        "CONTENT_COMMAND_SUITE",
      ],
      2_000,
      11_920,
    ],
  ] as const)(
    "applies exact bundle boundary for %s",
    (enhancementCodes, bundleDiscountBps, finalMonthlyCents) => {
      const result = calculateQuote(
        q({ coreCode: "FREE", enhancementCodes: [...enhancementCodes] }),
        PRICING_2026_06_30,
      );
      expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
        tierDiscountBps: 0,
        bundleDiscountBps,
        appliedDiscountBps: bundleDiscountBps,
        finalMonthlyCents,
      });
    },
  );

  it("prices Spark + one software enhancement with tier discount only", () => {
    const result = calculateQuote(
      q({ enhancementCodes: ["AI_MARKETING_COPILOT"] }),
      PRICING_2026_06_30,
    );

    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      listMonthlyCents: 14_900,
      tierDiscountBps: 500,
      bundleDiscountBps: 0,
      appliedDiscountBps: 500,
      finalMonthlyCents: 14_155,
      reasonCode: "SOFTWARE_TIER",
    });
    expect(result.totals).toEqual({
      setupCents: 99_900,
      monthlyCents: 24_055,
      commissionableMrrCents: 24_055,
      upfrontCommissionCents: 24_975,
      monthlyResidualCents: 2_406,
      yearOneEarningsCents: 53_847,
    });
  });

  it("unlocks the 10% software bundle discount at two eligible enhancements", () => {
    const result = calculateQuote(
      q({
        enhancementCodes: [
          "AI_MARKETING_COPILOT",
          "VISIBILITY_ACCELERATOR",
        ],
      }),
      PRICING_2026_06_30,
    );

    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      appliedDiscountBps: 1_500,
      finalMonthlyCents: 12_665,
    });
    expect(line(result, "VISIBILITY_ACCELERATOR")).toMatchObject({
      appliedDiscountBps: 1_500,
      finalMonthlyCents: 15_215,
    });
    expect(result.totals.monthlyCents).toBe(37_780);
    expect(result.totals.monthlyResidualCents).toBe(3_778);
  });

  it("lets a service count unlock software bundle pricing but caps the service itself", () => {
    const result = calculateQuote(
      q({
        coreCode: "SPARK_PRO",
        enhancementCodes: ["AI_MARKETING_COPILOT", "VIDEO_VELOCITY"],
      }),
      PRICING_2026_06_30,
    );

    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      tierDiscountBps: 1_000,
      bundleDiscountBps: 1_000,
      appliedDiscountBps: 2_000,
      finalMonthlyCents: 11_920,
    });
    expect(line(result, "VIDEO_VELOCITY")).toMatchObject({
      tierDiscountBps: 1_000,
      bundleDiscountBps: 0,
      appliedDiscountBps: 1_000,
      finalMonthlyCents: 53_730,
      reasonCode: "SERVICE_CAP",
    });
    expect(result.totals.monthlyCents).toBe(105_550);
  });

  it("applies Insight's 12% software tier, 15% three-item bundle, and 10% service cap", () => {
    const result = calculateQuote(
      q({
        coreCode: "INSIGHT",
        enhancementCodes: [
          "AI_MARKETING_COPILOT",
          "SOCIAL_COMMAND",
          "VIDEO_VELOCITY",
        ],
      }),
      PRICING_2026_06_30,
    );

    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      appliedDiscountBps: 2_700,
      finalMonthlyCents: 10_877,
    });
    expect(line(result, "SOCIAL_COMMAND").finalMonthlyCents).toBe(26_910);
    expect(line(result, "VIDEO_VELOCITY").finalMonthlyCents).toBe(53_730);
    expect(result.totals.monthlyCents).toBe(151_417);
  });

  it("caps Intelligence Pro plus four software products at 38% per line", () => {
    const result = calculateQuote(
      q({
        coreCode: "INTELLIGENCE_PRO",
        enhancementCodes: [
          "AI_MARKETING_COPILOT",
          "VISIBILITY_ACCELERATOR",
          "RETENTION_ENGINE",
          "LEAD_VELOCITY",
        ],
      }),
      PRICING_2026_06_30,
    );

    expect(
      result.lines
        .filter((candidate) => candidate.kind === "enhancement")
        .map((candidate) => [
          candidate.productCode,
          candidate.appliedDiscountBps,
          candidate.finalMonthlyCents,
        ]),
    ).toEqual([
      ["AI_MARKETING_COPILOT", 3_800, 9_238],
      ["VISIBILITY_ACCELERATOR", 3_800, 11_098],
      ["RETENTION_ENGINE", 3_800, 11_098],
      ["LEAD_VELOCITY", 3_800, 15_438],
    ]);
    expect(result.totals.monthlyCents).toBe(196_772);
  });

  it("applies Intelligence's 12% service cap and 38% capped software discount", () => {
    const result = calculateQuote(
      q({
        coreCode: "INTELLIGENCE",
        enhancementCodes: [
          "AI_MARKETING_COPILOT",
          "SOCIAL_COMMAND",
          "VIDEO_VELOCITY",
          "CONTENT_COMMAND_SUITE",
        ],
      }),
      PRICING_2026_06_30,
    );

    expect(line(result, "AI_MARKETING_COPILOT").finalMonthlyCents).toBe(9_238);
    expect(line(result, "SOCIAL_COMMAND").finalMonthlyCents).toBe(26_312);
    expect(line(result, "VIDEO_VELOCITY").finalMonthlyCents).toBe(52_536);
    expect(line(result, "CONTENT_COMMAND_SUITE").finalMonthlyCents).toBe(70_136);
    expect(result.totals.monthlyCents).toBe(258_122);
  });

  it("keeps Ads Command and ad spend undiscounted and excludes pass-through spend from commission", () => {
    const result = calculateQuote(
      q({
        coreCode: "INTELLIGENCE_PRO",
        enhancementCodes: ["ADS_COMMAND"],
        adSpendCents: 200_000,
      }),
      PRICING_2026_06_30,
    );

    expect(line(result, "ADS_COMMAND")).toMatchObject({
      appliedDiscountBps: 0,
      finalMonthlyCents: 149_700,
      reasonCode: "ADS_EXEMPT",
    });
    expect(line(result, "AD_SPEND")).toMatchObject({
      appliedDiscountBps: 0,
      finalMonthlyCents: 200_000,
      commissionableMonthlyCents: 0,
      reasonCode: "PASS_THROUGH",
    });
    expect(result.totals).toMatchObject({
      monthlyCents: 499_600,
      commissionableMrrCents: 299_600,
      monthlyResidualCents: 29_960,
    });
  });

  it("does not let exempt Ads Command unlock a software bundle discount", () => {
    const result = calculateQuote(
      q({
        coreCode: "INTELLIGENCE_PRO",
        enhancementCodes: ["AI_MARKETING_COPILOT", "ADS_COMMAND"],
        adSpendCents: 50_000,
      }),
      PRICING_2026_06_30,
    );

    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      tierDiscountBps: 2_000,
      bundleDiscountBps: 0,
      appliedDiscountBps: 2_000,
      finalMonthlyCents: 11_920,
    });
    expect(result.totals.monthlyCents).toBe(361_520);
  });

  it("allows a core-only quote with a soft attach warning", () => {
    const result = calculateQuote(q(), PRICING_2026_06_30);

    expect(result.totals).toMatchObject({
      setupCents: 99_900,
      monthlyCents: 9_900,
    });
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "NO_ENHANCEMENTS" }),
      ]),
    );
  });

  it.each([
    [
      "duplicate enhancement",
      q({ enhancementCodes: ["LEAD_VELOCITY", "LEAD_VELOCITY"] }),
      "DUPLICATE_PRODUCT",
    ],
    ["ad spend without Ads Command", q({ adSpendCents: 1 }), "ADS_REQUIRED"],
    [
      "negative ad spend",
      q({ enhancementCodes: ["ADS_COMMAND"], adSpendCents: -1 }),
      "INVALID_MONEY",
    ],
    ["unknown product", q({ coreCode: "NOT_A_CORE" as never }), "UNKNOWN_PRODUCT"],
    ["unapproved Nexus", q({ coreCode: "NEXUS" }), "CUSTOM_APPROVAL_REQUIRED"],
  ])("rejects %s", (_name, input, expectedCode) => {
    try {
      calculateQuote(input, PRICING_2026_06_30);
      throw new Error("Expected calculateQuote to reject invalid input");
    } catch (error) {
      expect(error).toBeInstanceOf(PricingError);
      expect((error as PricingError).code).toBe(expectedCode);
    }
  });

  it("is invariant to enhancement input order", () => {
    const a = calculateQuote(
      q({
        coreCode: "INSIGHT",
        enhancementCodes: [
          "AI_MARKETING_COPILOT",
          "SOCIAL_COMMAND",
          "VIDEO_VELOCITY",
        ],
      }),
      PRICING_2026_06_30,
    );
    const b = calculateQuote(
      q({
        coreCode: "INSIGHT",
        enhancementCodes: [
          "VIDEO_VELOCITY",
          "AI_MARKETING_COPILOT",
          "SOCIAL_COMMAND",
        ],
      }),
      PRICING_2026_06_30,
    );

    expect(b.calculationHash).toBe(a.calculationHash);
    expect(b.totals).toEqual(a.totals);
  });

  it("returns integer cents and never exceeds the line cap", () => {
    const result = calculateQuote(
      q({
        coreCode: "INTELLIGENCE_PRO",
        enhancementCodes: [
          "AI_MARKETING_COPILOT",
          "VISIBILITY_ACCELERATOR",
          "RETENTION_ENGINE",
          "LEAD_VELOCITY",
          "SOCIAL_COMMAND",
          "VIDEO_VELOCITY",
          "CONTENT_COMMAND_SUITE",
          "ADS_COMMAND",
        ],
        adSpendCents: 123_45,
      }),
      PRICING_2026_06_30,
    );

    for (const candidate of result.lines) {
      expect(candidate.appliedDiscountBps).toBeLessThanOrEqual(3_800);
      expect(Number.isInteger(candidate.finalMonthlyCents)).toBe(true);
      expect(Number.isInteger(candidate.finalSetupCents)).toBe(true);
    }
    Object.values(result.totals).forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
    });
  });
});
