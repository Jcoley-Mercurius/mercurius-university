"use server";

import { calculateQuote, PRICING_2026_06_30, QuoteInputSchema, type QuoteInput } from "@mercurius/domain";
import { gradePracticeQuote, type PracticeGradeResult } from "@/features/practice-grading/grade-practice-quote";
import { adminQuery } from "@/lib/db/server";
import { getCurrentRep } from "@/lib/auth/current-rep";

export type GradePracticeQuoteResult =
  | { readonly ok: true; readonly scenarioTitle: string; readonly grade: PracticeGradeResult }
  | { readonly ok: false; readonly message: string };

interface ScenarioRow {
  title: string;
  expected_catalog_version: string;
  expected_input_json: unknown;
}

export async function gradePracticeQuoteAction(request: {
  readonly scenarioId: string;
  readonly quote: QuoteInput;
}): Promise<GradePracticeQuoteResult> {
  try {
    const rep = await getCurrentRep();
    if (!rep) return { ok: false, message: "Sign in to submit a practice quote." };
    if (!rep.membership) return { ok: false, message: "An active organization membership is required for grading." };
    if (!/^[0-9a-f-]{36}$/i.test(request.scenarioId)) return { ok: false, message: "Choose a valid practice scenario." };

    const scenarios = await adminQuery<ScenarioRow>(
      `select title, expected_catalog_version, expected_input_json
         from practice_scenarios
        where id = $1 and organization_id = $2 and active = true`,
      [request.scenarioId, rep.membership.organization_id],
    );
    const scenario = scenarios[0];
    if (!scenario) return { ok: false, message: "Practice scenario was not found for your organization." };
    if (scenario.expected_catalog_version !== PRICING_2026_06_30.version) {
      return { ok: false, message: "This scenario uses a catalog version that is not available." };
    }
    const expected = QuoteInputSchema.safeParse(scenario.expected_input_json);
    if (!expected.success) return { ok: false, message: "The scenario’s expected answer is not configured correctly." };
    const expectedInput: QuoteInput = {
      coreCode: expected.data.coreCode,
      enhancementCodes: expected.data.enhancementCodes,
      adSpendCents: expected.data.adSpendCents,
      ...(expected.data.nexusPricing ? { nexusPricing: expected.data.nexusPricing } : {}),
      ...(expected.data.managerApproval ? { managerApproval: expected.data.managerApproval } : {}),
    };

    const submittedCalculation = calculateQuote(request.quote, PRICING_2026_06_30);
    const expectedCalculation = calculateQuote(expectedInput, PRICING_2026_06_30);
    return {
      ok: true,
      scenarioTitle: scenario.title,
      grade: gradePracticeQuote({
        submittedInput: request.quote,
        expectedInput,
        submittedCalculation,
        expectedCalculation,
      }),
    };
  } catch (error) {
    console.error("Practice quote grading failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Practice quote could not be graded." };
  }
}
