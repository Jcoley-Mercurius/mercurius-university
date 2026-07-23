import type { QuoteCalculation, QuoteInput } from "@mercurius/domain";

export interface PracticeGradeResult {
  readonly score: number;
  readonly level: "perfect" | "strong" | "developing" | "retry";
  readonly correctDecisions: readonly string[];
  readonly mistakes: readonly string[];
  readonly coachingNotes: readonly string[];
  readonly submittedMonthlyCents: number;
  readonly expectedMonthlyCents: number;
}

export interface GradePracticeQuoteInput {
  readonly submittedInput: QuoteInput;
  readonly expectedInput: QuoteInput;
  readonly submittedCalculation: QuoteCalculation;
  readonly expectedCalculation: QuoteCalculation;
}

const productNames = (calculation: QuoteCalculation) => new Map(
  calculation.lines.map((line) => [line.productCode, line.productName]),
);

function label(code: string, ...maps: Map<string, string>[]) {
  for (const map of maps) {
    const name = map.get(code);
    if (name) return name;
  }
  return code.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function monthlyPoints(submitted: number, expected: number) {
  if (submitted === expected) return 20;
  const difference = Math.abs(submitted - expected);
  const ratio = expected === 0 ? 1 : difference / expected;
  if (ratio <= 0.01) return 18;
  if (ratio <= 0.05) return 15;
  if (ratio <= 0.10) return 10;
  if (ratio <= 0.20) return 5;
  return 0;
}

export function gradePracticeQuote(input: GradePracticeQuoteInput): PracticeGradeResult {
  const correctDecisions: string[] = [];
  const mistakes: string[] = [];
  const coachingNotes: string[] = [];
  const submittedNames = productNames(input.submittedCalculation);
  const expectedNames = productNames(input.expectedCalculation);

  const coreCorrect = input.submittedInput.coreCode === input.expectedInput.coreCode;
  if (coreCorrect) {
    correctDecisions.push(`Core package: ${label(input.expectedInput.coreCode, expectedNames)} is the right foundation.`);
  } else {
    mistakes.push(`Core package: selected ${label(input.submittedInput.coreCode, submittedNames)}, expected ${label(input.expectedInput.coreCode, expectedNames)}.`);
    coachingNotes.push("Start with the scenario’s primary business need, then choose the core tier that supports the required solution depth.");
  }

  const submitted = new Set(input.submittedInput.enhancementCodes);
  const expected = new Set(input.expectedInput.enhancementCodes);
  const intersection = [...submitted].filter((code) => expected.has(code));
  const missing = [...expected].filter((code) => !submitted.has(code));
  const extra = [...submitted].filter((code) => !expected.has(code));
  intersection.forEach((code) => correctDecisions.push(`Included ${label(code, expectedNames, submittedNames)}.`));
  if (missing.length === 0 && extra.length === 0) {
    correctDecisions.push("The enhancement mix matches the scenario needs.");
  }
  missing.forEach((code) => mistakes.push(`Missing enhancement: ${label(code, expectedNames)}.`));
  extra.forEach((code) => mistakes.push(`Unneeded enhancement: ${label(code, submittedNames)}.`));
  if (missing.length > 0) coachingNotes.push("Connect each stated vendor pain to a specific enhancement before finalizing the package.");
  if (extra.length > 0) coachingNotes.push("Avoid adding products that are not supported by the scenario; a focused recommendation builds trust.");

  const union = new Set([...submitted, ...expected]);
  const enhancementPoints = union.size === 0 ? 40 : 40 * intersection.length / union.size;
  const expectedAds = expected.has("ADS_COMMAND");
  const submittedAds = submitted.has("ADS_COMMAND");
  let adsPoints = 0;
  if (!expectedAds && !submittedAds && input.submittedInput.adSpendCents === 0) {
    adsPoints = 10;
    correctDecisions.push("Correctly left Ads Command and ad spend out of this scenario.");
  } else if (expectedAds === submittedAds && expectedAds) {
    const expectedSpend = input.expectedInput.adSpendCents;
    const submittedSpend = input.submittedInput.adSpendCents;
    const differenceRatio = expectedSpend === 0
      ? (submittedSpend === 0 ? 0 : 1)
      : Math.abs(submittedSpend - expectedSpend) / expectedSpend;
    adsPoints = differenceRatio === 0 ? 10 : differenceRatio <= 0.10 ? 7 : submittedSpend > 0 ? 4 : 0;
    if (differenceRatio === 0) correctDecisions.push("Ads Command and ad spend were handled correctly.");
    else {
      mistakes.push(`Ad spend does not match the scenario target (${money(input.expectedInput.adSpendCents)} expected).`);
      coachingNotes.push("Treat ad spend as pass-through: include it only with Ads Command and match the scenario’s stated media budget.");
    }
  } else {
    mistakes.push(expectedAds ? "Ads Command is required for this scenario." : "Ads Command was not needed for this scenario.");
    coachingNotes.push("Use Ads Command only when the scenario calls for paid acquisition, and pair it with the stated ad-spend amount.");
  }

  const submittedMonthly = input.submittedCalculation.totals.monthlyCents;
  const expectedMonthly = input.expectedCalculation.totals.monthlyCents;
  const totalPoints = monthlyPoints(submittedMonthly, expectedMonthly);
  if (submittedMonthly === expectedMonthly) correctDecisions.push("Monthly pricing and quote structure match the expected outcome.");
  else {
    mistakes.push(`Monthly total is ${money(submittedMonthly)}; the expected structure produces ${money(expectedMonthly)}.`);
    coachingNotes.push("Review the package structure above—the pricing engine is correct, so total differences come from product or ad-spend decisions.");
  }

  const score = Math.round((coreCorrect ? 30 : 0) + enhancementPoints + adsPoints + totalPoints);
  return {
    score,
    level: score === 100 ? "perfect" : score >= 80 ? "strong" : score >= 60 ? "developing" : "retry",
    correctDecisions,
    mistakes,
    coachingNotes: [...new Set(coachingNotes)].slice(0, 3),
    submittedMonthlyCents: submittedMonthly,
    expectedMonthlyCents: expectedMonthly,
  };
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
