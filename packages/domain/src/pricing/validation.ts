import { z } from "zod";

import { PricingError } from "./errors";
import { basisPoints, cents } from "./money";
import type { QuoteInput } from "./types";

export const QuoteInputSchema = z
  .object({
    coreCode: z.string().trim().min(1),
    enhancementCodes: z.array(z.string().trim().min(1)).default([]),
    adSpendCents: z.number().int().nonnegative().default(0),
    nexusPricing: z
      .object({
        setupCents: z.number().int().nonnegative(),
        monthlyCents: z.number().int().nonnegative(),
        softwareTierDiscountBps: z.number().int().min(0).max(10_000),
        serviceCapBps: z.number().int().min(0).max(10_000),
      })
      .optional(),
    managerApproval: z
      .object({
        approvalId: z.string().trim().min(1),
        approvedBy: z.string().trim().min(1),
      })
      .optional(),
  })
  .strict();

export function parseQuoteInput(input: QuoteInput): QuoteInput {
  const result = QuoteInputSchema.safeParse(input);
  if (!result.success) {
    const invalidMoney = result.error.issues.some(
      (issue) => issue.path[0] === "adSpendCents" && input.adSpendCents < 0,
    );
    throw new PricingError(
      invalidMoney ? "INVALID_MONEY" : "INVALID_INPUT",
      "Quote input is invalid",
      { issues: result.error.issues },
    );
  }
  try {
    cents(result.data.adSpendCents);
    if (result.data.nexusPricing) {
      cents(result.data.nexusPricing.setupCents);
      cents(result.data.nexusPricing.monthlyCents);
      basisPoints(result.data.nexusPricing.softwareTierDiscountBps);
      basisPoints(result.data.nexusPricing.serviceCapBps);
    }
  } catch (error) {
    throw new PricingError("INVALID_MONEY", "Quote money is outside supported bounds", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
  return {
    coreCode: result.data.coreCode,
    enhancementCodes: result.data.enhancementCodes,
    adSpendCents: result.data.adSpendCents,
    ...(result.data.nexusPricing
      ? { nexusPricing: result.data.nexusPricing }
      : {}),
    ...(result.data.managerApproval
      ? { managerApproval: result.data.managerApproval }
      : {}),
  };
}
