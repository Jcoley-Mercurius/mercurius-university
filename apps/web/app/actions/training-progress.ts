"use server";

import { revalidatePath } from "next/cache";
import { certificationPrerequisiteKeys, findTrainingMilestone } from "@/lib/training-curriculum";
import { getCurrentRep } from "@/lib/auth/current-rep";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface TrainingProgressActionResult {
  readonly ok: boolean;
  readonly message: string;
  readonly href?: string;
}

export async function updateTrainingProgressAction(
  milestoneKey: string,
  status: "in_progress" | "complete",
): Promise<TrainingProgressActionResult> {
  try {
    const milestone = findTrainingMilestone(milestoneKey);
    if (!milestone || milestone.locked) return { ok: false, message: "This milestone is not available yet." };
    if (status === "in_progress" && !milestone.practiceScenarioId) return { ok: false, message: "This milestone does not launch a practice scenario." };
    if (status === "complete" && milestone.requiresPassingScore) return { ok: false, message: `Certification requires a graded score of ${milestone.requiresPassingScore} or higher.` };

    const rep = await getCurrentRep();
    if (!rep?.membership) return { ok: false, message: "An active organization membership is required." };

    const supabase = await createSupabaseServerClient();
    if (milestone.requiresPassingScore) {
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
    const now = new Date().toISOString();
    const payload = {
      organization_id: rep.membership.organization_id,
      membership_id: rep.membership.id,
      milestone_key: milestone.key,
      status,
      completed_at: status === "complete" ? now : null,
      updated_at: now,
    };
    const query = supabase.from("training_milestone_progress");
    const { error } = status === "in_progress"
      ? await query.upsert(payload, { onConflict: "membership_id,milestone_key", ignoreDuplicates: true })
      : await query.upsert(payload, { onConflict: "membership_id,milestone_key" });
    if (error) return { ok: false, message: `Progress could not be saved: ${error.message}` };

    revalidatePath("/training");
    return {
      ok: true,
      message: status === "complete" ? "Milestone completed." : "Practice started.",
      ...(milestone.practiceScenarioId
        ? { href: `/quote-lab?mode=practice&scenario=${encodeURIComponent(milestone.practiceScenarioId)}${milestone.requiresPassingScore ? "&certification=1" : ""}` }
        : {}),
    };
  } catch (error) {
    console.error("Training progress update failed", error);
    return { ok: false, message: "Training progress could not be updated." };
  }
}
