import type { QuoteCalculation } from "@mercurius/domain";

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const money = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function isQuoteCalculation(value: unknown): value is QuoteCalculation {
  if (!object(value) || !Array.isArray(value.lines) || value.lines.length === 0 || value.lines.length > 50 || !object(value.totals)) return false;
  if (typeof value.engineVersion !== "string" || typeof value.catalogVersion !== "string" ||
      typeof value.catalogCode !== "string" || typeof value.catalogChecksum !== "string" ||
      typeof value.calculationHash !== "string" || !/^[0-9a-f]{64}$/.test(value.calculationHash)) return false;
  const totals = value.totals;
  if (![totals.setupCents, totals.monthlyCents, totals.commissionableMrrCents,
    totals.upfrontCommissionCents, totals.monthlyResidualCents, totals.yearOneEarningsCents].every(money)) return false;
  return value.lines.every((line) => object(line) &&
    typeof line.productCode === "string" && line.productCode.length <= 80 &&
    typeof line.productName === "string" && line.productName.length <= 160 &&
    typeof line.explanation === "string" && line.explanation.length <= 1000 &&
    money(line.listSetupCents) && money(line.listMonthlyCents) &&
    money(line.finalSetupCents) && money(line.finalMonthlyCents) &&
    typeof line.appliedDiscountBps === "number" && line.appliedDiscountBps >= 0 && line.appliedDiscountBps <= 10_000
  );
}
