import { canonicalJson, deepFreeze, sha256 } from "./canonical";
import { PricingError } from "./errors";
import {
  applyDiscountHalfUp,
  basisPoints,
  cents,
  multiplyByBasisPointsHalfUp,
  sumCents,
} from "./money";
import type {
  BasisPoints,
  Cents,
} from "./money";
import type {
  CoreProduct,
  EnhancementProduct,
  PricingCatalog,
  QuoteCalculation,
  QuoteInput,
  QuoteLine,
  QuoteWarning,
  ReasonCode,
  TierDiscountRule,
} from "./types";
import { parseQuoteInput } from "./validation";

export const PRICING_ENGINE_VERSION = "1.0.0";

function assertCatalog(catalog: PricingCatalog): void {
  if (catalog.status !== "active") {
    throw new PricingError("INVALID_CATALOG", "Pricing catalog is not active");
  }
  const { checksum, checksumAlgorithm: _algorithm, ...payload } = catalog;
  if (sha256(canonicalJson(payload)) !== checksum) {
    throw new PricingError("INVALID_CATALOG", "Pricing catalog checksum mismatch");
  }
  const codes = [
    ...catalog.cores.map((product) => product.code),
    ...catalog.enhancements.map((product) => product.code),
  ];
  if (new Set(codes).size !== codes.length) {
    throw new PricingError("INVALID_CATALOG", "Pricing catalog contains duplicate codes");
  }
}

function requireProduct<T>(
  product: T | undefined,
  code: string,
): T {
  if (product === undefined || product === null) {
    throw new PricingError("UNKNOWN_PRODUCT", `Unknown product: ${code}`, { code });
  }
  return product;
}

function resolveTierRule(
  core: CoreProduct,
  input: QuoteInput,
  catalog: PricingCatalog,
): TierDiscountRule {
  const rule = requireProduct(
    catalog.tierRules.find((candidate) => candidate.coreCode === core.code),
    core.code,
  );
  if (!core.customPricing) return rule;
  if (!input.nexusPricing || !input.managerApproval) {
    throw new PricingError(
      "CUSTOM_APPROVAL_REQUIRED",
      "Nexus requires custom prices, explicit discount rules, and manager approval",
    );
  }
  return {
    coreCode: core.code,
    softwareBps: basisPoints(input.nexusPricing.softwareTierDiscountBps),
    serviceCapBps: basisPoints(input.nexusPricing.serviceCapBps),
  };
}

function resolveBundleBps(
  bundleCount: number,
  catalog: PricingCatalog,
): BasisPoints {
  const match = [...catalog.bundleRules]
    .sort((left, right) => right.minimumCount - left.minimumCount)
    .find((rule) => bundleCount >= rule.minimumCount);
  if (!match) {
    throw new PricingError("INVALID_CATALOG", "Catalog has no base bundle rule");
  }
  return match.discountBps;
}

function coreLine(core: CoreProduct, input: QuoteInput): QuoteLine {
  const setup = core.customPricing
    ? cents(input.nexusPricing!.setupCents)
    : requireProduct(core.setupCents ?? undefined, core.code);
  const monthly = core.customPricing
    ? cents(input.nexusPricing!.monthlyCents)
    : requireProduct(core.monthlyCents ?? undefined, core.code);
  return {
    productCode: core.code,
    productName: core.name,
    kind: "core",
    classification: "core",
    listSetupCents: setup,
    listMonthlyCents: monthly,
    tierDiscountBps: basisPoints(0),
    bundleDiscountBps: basisPoints(0),
    appliedDiscountBps: basisPoints(0),
    finalSetupCents: setup,
    finalMonthlyCents: monthly,
    commissionableMonthlyCents: monthly,
    reasonCode: "CORE_LIST",
    explanation: "Core package is quoted at catalog or manager-approved custom price.",
  };
}

function enhancementLine(
  enhancement: EnhancementProduct,
  tierRule: TierDiscountRule,
  bundleDiscountBps: BasisPoints,
  catalog: PricingCatalog,
): QuoteLine {
  let tierDiscountBps = basisPoints(0);
  let appliedBundleBps = basisPoints(0);
  let appliedDiscountBps = basisPoints(0);
  let reasonCode: ReasonCode;
  let explanation: string;

  if (enhancement.classification === "software") {
    tierDiscountBps = requireProduct(
      tierRule.softwareBps ?? undefined,
      tierRule.coreCode,
    );
    appliedBundleBps = bundleDiscountBps;
    const uncapped = tierDiscountBps + appliedBundleBps;
    appliedDiscountBps = basisPoints(
      Math.min(uncapped, catalog.policies.maxLineDiscountBps),
    );
    reasonCode =
      uncapped > catalog.policies.maxLineDiscountBps
        ? "SOFTWARE_CAPPED"
        : appliedBundleBps > 0
          ? "SOFTWARE_TIER_BUNDLE"
          : "SOFTWARE_TIER";
    // Stryker disable all: explanatory copy is not pricing behavior.
    explanation =
      reasonCode === "SOFTWARE_CAPPED"
        ? "Software tier plus bundle discount was capped at 38% to protect margin."
        : appliedBundleBps > 0
          ? "Software receives the full tier and bundle discounts."
          : "Software receives the selected core package tier discount.";
    // Stryker restore all
  } else if (enhancement.classification === "service") {
    tierDiscountBps = requireProduct(
      tierRule.serviceCapBps ?? undefined,
      tierRule.coreCode,
    );
    appliedDiscountBps = basisPoints(
      Math.min(tierDiscountBps, catalog.policies.maxLineDiscountBps),
    );
    reasonCode = "SERVICE_CAP";
    // Stryker disable all: explanatory copy is not pricing behavior.
    explanation =
      "Service receives its capped tier discount only and no bundle discount.";
    // Stryker restore all
  } else {
    reasonCode = "ADS_EXEMPT";
    // Stryker disable all: explanatory copy is not pricing behavior.
    explanation =
      "Ads Command is exempt from discounts and does not count toward bundles.";
    // Stryker restore all
  }

  const finalMonthly = applyDiscountHalfUp(
    enhancement.monthlyCents,
    appliedDiscountBps,
  );
  return {
    productCode: enhancement.code,
    productName: enhancement.name,
    kind: "enhancement",
    classification: enhancement.classification,
    listSetupCents: cents(0),
    listMonthlyCents: enhancement.monthlyCents,
    tierDiscountBps,
    bundleDiscountBps: appliedBundleBps,
    appliedDiscountBps,
    finalSetupCents: cents(0),
    finalMonthlyCents: finalMonthly,
    commissionableMonthlyCents: finalMonthly,
    reasonCode,
    explanation,
  };
}

function adSpendLine(adSpendCents: number): QuoteLine {
  const amount = cents(adSpendCents);
  return {
    productCode: "AD_SPEND",
    productName: "Ad Spend",
    kind: "ad_spend",
    classification: "pass_through",
    listSetupCents: cents(0),
    listMonthlyCents: amount,
    tierDiscountBps: basisPoints(0),
    bundleDiscountBps: basisPoints(0),
    appliedDiscountBps: basisPoints(0),
    finalSetupCents: cents(0),
    finalMonthlyCents: amount,
    commissionableMonthlyCents: cents(0),
    reasonCode: "PASS_THROUGH",
    explanation:
      "Ad spend is vendor pass-through: never discounted and never commissionable.",
  };
}

export function calculateQuote(
  rawInput: QuoteInput,
  catalog: PricingCatalog,
): QuoteCalculation {
  assertCatalog(catalog);
  const input = parseQuoteInput(rawInput);
  const core = requireProduct(
    catalog.cores.find((product) => product.code === input.coreCode),
    input.coreCode,
  );
  const duplicateCodes = input.enhancementCodes.filter(
    (code, index) => input.enhancementCodes.indexOf(code) !== index,
  );
  if (duplicateCodes.length > 0) {
    throw new PricingError(
      "DUPLICATE_PRODUCT",
      "An enhancement can be selected only once",
      { codes: [...new Set(duplicateCodes)] },
    );
  }

  const selected = input.enhancementCodes.map((code) =>
    requireProduct(
      catalog.enhancements.find((enhancement) => enhancement.code === code),
      code,
    ),
  );
  const adsSelected = selected.some(
    (enhancement) => enhancement.code === "ADS_COMMAND",
  );
  if (input.adSpendCents > 0 && !adsSelected) {
    throw new PricingError(
      "ADS_REQUIRED",
      "Ad spend can be entered only when Ads Command is selected",
    );
  }

  const tierRule = resolveTierRule(core, input, catalog);
  const bundleCount = selected.filter(
    (enhancement) => enhancement.classification !== "ads",
  ).length;
  const bundleBps = resolveBundleBps(bundleCount, catalog);
  const orderedEnhancements = [...selected].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const lines: QuoteLine[] = [
    coreLine(core, input),
    ...orderedEnhancements.map((enhancement) =>
      enhancementLine(enhancement, tierRule, bundleBps, catalog),
    ),
  ];
  if (input.adSpendCents > 0) lines.push(adSpendLine(input.adSpendCents));

  const setupCents = sumCents(lines.map((line) => line.finalSetupCents));
  const monthlyCents = sumCents(lines.map((line) => line.finalMonthlyCents));
  const commissionableMrrCents = sumCents(
    lines.map((line) => line.commissionableMonthlyCents),
  );
  const upfrontCommissionCents = multiplyByBasisPointsHalfUp(
    setupCents,
    catalog.policies.upfrontCommissionBps,
  );
  const monthlyResidualCents = multiplyByBasisPointsHalfUp(
    commissionableMrrCents,
    catalog.policies.residualBps,
  );
  const yearOneEarningsCents = cents(
    upfrontCommissionCents +
      monthlyResidualCents * catalog.policies.yearOneResidualPayments,
  );
  const totals = {
    setupCents,
    monthlyCents,
    commissionableMrrCents,
    upfrontCommissionCents,
    monthlyResidualCents,
    yearOneEarningsCents,
  };
  const warnings: QuoteWarning[] = [
    ...(selected.length === 0
      ? [
          {
            code: "NO_ENHANCEMENTS" as const,
            message:
              "Core-only quotes are allowed; confirm that enhancement needs were explored.",
          },
        ]
      : []),
    {
      code: "RESIDUAL_STARTS_MONTH_2",
      message: "Lifetime residual payments begin in Month 2.",
    },
  ];
  const canonicalInput = {
    ...input,
    enhancementCodes: [...input.enhancementCodes].sort(),
  };
  const unsigned = {
    engineVersion: PRICING_ENGINE_VERSION,
    catalogCode: catalog.code,
    catalogVersion: catalog.version,
    catalogChecksum: catalog.checksum,
    lines,
    totals,
    warnings,
  };
  return deepFreeze({
    ...unsigned,
    calculationHash: sha256(canonicalJson({ input: canonicalInput, output: unsigned })),
  });
}
