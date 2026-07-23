import { describe, expect, it } from "vitest";

import {
  PRICING_2026_06_30,
  PricingError,
  calculateQuote,
  canonicalJson,
  sha256,
  type PricingCatalog,
  type QuoteInput,
} from "../src/pricing/index.js";

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

function expectPricingError(input: QuoteInput, code: string): void {
  try {
    calculateQuote(input, PRICING_2026_06_30);
    throw new Error("Expected calculateQuote to reject invalid input");
  } catch (error) {
    expect(error).toBeInstanceOf(PricingError);
    expect((error as PricingError).code).toBe(code);
  }
}

function signedCatalog(
  overrides: Partial<Omit<PricingCatalog, "checksum" | "checksumAlgorithm">>,
): PricingCatalog {
  const {
    checksum: _checksum,
    checksumAlgorithm: _algorithm,
    ...originalPayload
  } = PRICING_2026_06_30;
  const payload = { ...originalPayload, ...overrides };
  return {
    ...payload,
    checksumAlgorithm: "SHA-256",
    checksum: sha256(canonicalJson(payload)),
  };
}

describe("immutable Pricing Reference Sheet catalog 2026-06-30", () => {
  it("matches standard SHA-256 vectors and canonical key ordering", () => {
    expect(sha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(canonicalJson({ z: 1, a: { d: 2, b: 1 } })).toBe(
      '{"a":{"b":1,"d":2},"z":1}',
    );
  });

  it("is deeply frozen and has a valid SHA-256 checksum", () => {
    expect(Object.isFrozen(PRICING_2026_06_30)).toBe(true);
    expect(Object.isFrozen(PRICING_2026_06_30.cores)).toBe(true);
    const { checksum, checksumAlgorithm, ...payload } = PRICING_2026_06_30;
    expect(checksumAlgorithm).toBe("SHA-256");
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256(canonicalJson(payload))).toBe(checksum);
    expect(() => {
      (PRICING_2026_06_30.cores as unknown as { name: string }[])[0]!.name =
        "mutated";
    }).toThrow(TypeError);
  });

  it.each([
    ["FREE", 0, 0],
    ["SPARK", 99_900, 9_900],
    ["SPARK_PRO", 150_000, 39_900],
    ["INSIGHT", 250_000, 59_900],
    ["INTELLIGENCE", 450_000, 99_900],
    ["INTELLIGENCE_PRO", 650_000, 149_900],
  ] as const)("seeds exact %s core pricing", (code, setup, monthly) => {
    const result = calculateQuote(q({ coreCode: code }), PRICING_2026_06_30);
    expect(line(result, code)).toMatchObject({
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
    [
      "retired status",
      signedCatalog({ status: "retired" }),
    ],
    [
      "checksum mismatch",
      { ...PRICING_2026_06_30, checksum: "0".repeat(64) } as PricingCatalog,
    ],
    [
      "duplicate catalog product",
      signedCatalog({
        enhancements: [
          ...PRICING_2026_06_30.enhancements,
          PRICING_2026_06_30.enhancements[0]!,
        ],
      }),
    ],
    [
      "missing base bundle rule",
      signedCatalog({
        bundleRules: PRICING_2026_06_30.bundleRules.filter(
          (rule) => rule.minimumCount > 0,
        ),
      }),
    ],
  ])("rejects invalid catalog: %s", (_name, catalog) => {
    expect(() => calculateQuote(q(), catalog)).toThrowError(
      expect.objectContaining({ code: "INVALID_CATALOG" }),
    );
  });
});

describe("Mercurius Quote Lab calculation engine", () => {
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
    "applies exact %s service cap",
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
        reasonCode: "SERVICE_CAP",
      });
    },
  );

  it("prices Spark + one software enhancement with exact earnings rounding", () => {
    const result = calculateQuote(
      q({ enhancementCodes: ["AI_MARKETING_COPILOT"] }),
      PRICING_2026_06_30,
    );
    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
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

  it("unlocks 10% bundle pricing at two eligible enhancements", () => {
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
      reasonCode: "SOFTWARE_TIER_BUNDLE",
    });
    expect(line(result, "VISIBILITY_ACCELERATOR")).toMatchObject({
      appliedDiscountBps: 1_500,
      finalMonthlyCents: 15_215,
    });
    expect(result.totals.monthlyCents).toBe(37_780);
    expect(result.totals.monthlyResidualCents).toBe(3_778);
  });

  it("counts service toward the bundle but caps the service itself", () => {
    const result = calculateQuote(
      q({
        coreCode: "SPARK_PRO",
        enhancementCodes: ["AI_MARKETING_COPILOT", "VIDEO_VELOCITY"],
      }),
      PRICING_2026_06_30,
    );
    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      appliedDiscountBps: 2_000,
      finalMonthlyCents: 11_920,
    });
    expect(line(result, "VIDEO_VELOCITY")).toMatchObject({
      tierDiscountBps: 1_000,
      bundleDiscountBps: 0,
      appliedDiscountBps: 1_000,
      finalMonthlyCents: 53_730,
    });
    expect(result.totals.monthlyCents).toBe(105_550);
  });

  it("applies Insight 12% tier + 15% bundle and 10% services", () => {
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

  it("hard-caps Intelligence Pro + four software lines at 38%", () => {
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
          candidate.reasonCode,
        ]),
    ).toEqual([
      ["AI_MARKETING_COPILOT", 3_800, 9_238, "SOFTWARE_CAPPED"],
      ["VISIBILITY_ACCELERATOR", 3_800, 11_098, "SOFTWARE_CAPPED"],
      ["RETENTION_ENGINE", 3_800, 11_098, "SOFTWARE_CAPPED"],
      ["LEAD_VELOCITY", 3_800, 15_438, "SOFTWARE_CAPPED"],
    ]);
    expect(result.totals.monthlyCents).toBe(196_772);
  });

  it("applies Intelligence 12% service caps and 38% software cap", () => {
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
    expect(line(result, "AI_MARKETING_COPILOT")).toMatchObject({
      appliedDiscountBps: 3_800,
      finalMonthlyCents: 9_238,
      reasonCode: "SOFTWARE_TIER_BUNDLE",
    });
    expect(line(result, "SOCIAL_COMMAND").finalMonthlyCents).toBe(26_312);
    expect(line(result, "VIDEO_VELOCITY").finalMonthlyCents).toBe(52_536);
    expect(line(result, "CONTENT_COMMAND_SUITE").finalMonthlyCents).toBe(70_136);
    expect(result.totals.monthlyCents).toBe(258_122);
  });

  it("keeps Ads and ad spend exempt; spend is noncommissionable", () => {
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

  it("does not let Ads unlock software bundle pricing", () => {
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

  it("allows core-only quotes with warnings and Month 2 disclosure", () => {
    const result = calculateQuote(q(), PRICING_2026_06_30);
    expect(result.totals).toMatchObject({
      setupCents: 99_900,
      monthlyCents: 9_900,
    });
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "NO_ENHANCEMENTS",
      "RESIDUAL_STARTS_MONTH_2",
    ]);
  });

  it.each([
    [
      "duplicate enhancement",
      q({ enhancementCodes: ["LEAD_VELOCITY", "LEAD_VELOCITY"] }),
      "DUPLICATE_PRODUCT",
    ],
    ["ad spend without Ads", q({ adSpendCents: 1 }), "ADS_REQUIRED"],
    [
      "negative ad spend",
      q({ enhancementCodes: ["ADS_COMMAND"], adSpendCents: -1 }),
      "INVALID_MONEY",
    ],
    [
      "unsafe integer ad spend",
      q({ adSpendCents: Number.MAX_SAFE_INTEGER }),
      "INVALID_MONEY",
    ],
    ["unknown core", q({ coreCode: "NOT_A_CORE" }), "UNKNOWN_PRODUCT"],
    [
      "unknown enhancement",
      q({ enhancementCodes: ["NOT_AN_ENHANCEMENT"] }),
      "UNKNOWN_PRODUCT",
    ],
    ["unapproved Nexus", q({ coreCode: "NEXUS" }), "CUSTOM_APPROVAL_REQUIRED"],
  ])("rejects %s", (_name, input, code) => expectPricingError(input, code));

  it("supports explicitly approved Nexus custom pricing and discount rules", () => {
    const result = calculateQuote(
      q({
        coreCode: "NEXUS",
        enhancementCodes: ["AI_MARKETING_COPILOT", "SOCIAL_COMMAND"],
        nexusPricing: {
          setupCents: 1_100_000,
          monthlyCents: 200_000,
          softwareTierDiscountBps: 500,
          serviceCapBps: 300,
        },
        managerApproval: { approvalId: "approval-1", approvedBy: "manager-1" },
      }),
      PRICING_2026_06_30,
    );
    expect(result.totals.setupCents).toBe(1_100_000);
    expect(line(result, "AI_MARKETING_COPILOT").appliedDiscountBps).toBe(1_500);
    expect(line(result, "SOCIAL_COMMAND").appliedDiscountBps).toBe(300);
  });

  it("is invariant to enhancement input order and returns frozen integer output", () => {
    const selections = [
      "AI_MARKETING_COPILOT",
      "SOCIAL_COMMAND",
      "VIDEO_VELOCITY",
    ];
    const a = calculateQuote(
      q({ coreCode: "INSIGHT", enhancementCodes: selections }),
      PRICING_2026_06_30,
    );
    const b = calculateQuote(
      q({ coreCode: "INSIGHT", enhancementCodes: [...selections].reverse() }),
      PRICING_2026_06_30,
    );
    expect(b.calculationHash).toBe(a.calculationHash);
    expect(b.totals).toEqual(a.totals);
    expect(Object.isFrozen(a.lines)).toBe(true);
    for (const candidate of a.lines) {
      expect(candidate.appliedDiscountBps).toBeLessThanOrEqual(3_800);
      expect(Number.isInteger(candidate.finalMonthlyCents)).toBe(true);
    }
    Object.values(a.totals).forEach((value) =>
      expect(Number.isInteger(value)).toBe(true),
    );
  });
});
