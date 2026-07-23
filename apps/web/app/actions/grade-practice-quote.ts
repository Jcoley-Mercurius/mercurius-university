"use server";

import { revalidatePath } from "next/cache";
import { calculateQuote, PRICING_2026_06_30, QuoteInputSchema, type QuoteInput } from "@mercurius/domain";
import { gradePracticeQuote, type PracticeGradeResult } from "@/features/practice-grading/grade-practice-quote";
import { adminQuery } from "@/lib/db/server";
import { getCurrentRep } from "@/lib/auth/current-rep";
import { certificationPrerequisiteKeys, findTrainingMilestone } from "@/lib/training-curriculum";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CertificationGradeOutcome {
  readonly passingScore: number;
  readonly passed: boolean;
  readonly bestScore: number;
}

const certificationPassingScore = findTrainingMilestone("certification-readiness")?.requiresPassingScore ?? 80;

export type GradePracticeQuoteResult =
  | { readonly ok: true; readonly scenarioTitle: string; readonly grade: PracticeGradeResult; readonly certification?: CertificationGradeOutcome }
  | { readonly ok: false; readonly message: string };

interface ScenarioRow {
  title: string;
  expected_catalog_version: string;
  expected_input_json: unknown;
}

export async function gradePracticeQuoteAction(request: {
  readonly scenarioId: string;
  readonly quote: QuoteInput;
  readonly certificationAttempt?: boolean;
}): Promise<GradePracticeQuoteResult> {
  try {
    const rep = await getCurrentRep();
    if (!rep) return { ok: false, message: "Sign in to submit a practice quote." };
    if (!rep.membership) return { ok: false, message: "An active organization membership is required for grading." };
    if (!/^[0-9a-f-]{36}$/i.test(request.scenarioId)) return { ok: false, message: "Choose a valid practice scenario." };
    const supabase = await createSupabaseServerClient();
    if (request.certificationAttempt) {
      const { data, error } = await supabase.from("training_milestone_progress")
        .select("milestone_key")
        .eq("membership_id", rep.membership.id)
        .eq("status", "complete")
        .in("milestone_key", certificationPrerequisiteKeys);
      if (error) return { ok: false, message: `Certification readiness could not be checked: ${error.message}` };
      const completedKeys = new Set((data ?? []).map((row) => row.milestone_key as string));
      const remaining = certificationPrerequisiteKeys.filter((key) => !completedKeys.has(key));
      if (remaining.length > 0) return { ok: false, message: `Complete ${remaining.length} required training milestone${remaining.length === 1 ? "" : "s"} before certification.` };
    }

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
    const grade = gradePracticeQuote({
      submittedInput: request.quote,
      expectedInput,
      submittedCalculation,
      expectedCalculation,
    });
    let certification: CertificationGradeOutcome | undefined;
    if (request.certificationAttempt) {
      const passingScore = certificationPassingScore;
      const { error: attemptError } = await supabase.from("training_certification_attempts").insert({
        organization_id: rep.membership.organization_id,
        membership_id: rep.membership.id,
        practice_scenario_id: request.scenarioId,
        score: grade.score,
        passing_score: passingScore,
        feedback_json: { mistakes: grade.mistakes, coachingNotes: grade.coachingNotes },
      });
      if (attemptError) return { ok: false, message: `Certification attempt could not be saved: ${attemptError.message}` };

      if (grade.score >= passingScore) {
        const now = new Date().toISOString();
        const { error: completionError } = await supabase.from("training_milestone_progress").upsert({
          organization_id: rep.membership.organization_id,
          membership_id: rep.membership.id,
          milestone_key: "certification-readiness",
          status: "complete",
          completed_at: now,
          updated_at: now,
        }, { onConflict: "membership_id,milestone_key" });
        if (completionError) return { ok: false, message: `Certification completion could not be saved: ${completionError.message}` };
      }
      const { data: bestAttempt } = await supabase.from("training_certification_attempts")
        .select("score")
        .eq("membership_id", rep.membership.id)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();
      certification = { passingScore, passed: grade.score >= passingScore, bestScore: bestAttempt?.score ?? grade.score };
      revalidatePath("/training");
    }
    return {
      ok: true,
      scenarioTitle: scenario.title,
      grade,
      ...(certification ? { certification } : {}),
    };
  } catch (error) {
    console.error("Practice quote grading failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Practice quote could not be graded." };
  }
}
