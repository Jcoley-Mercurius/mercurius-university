"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, Play } from "lucide-react";
import { updateTrainingProgressAction } from "@/app/actions/training-progress";
import { Button } from "@/components/ui/button";
import { TrainingLessonViewer } from "@/components/training-lesson-viewer";
import type { TrainingLesson } from "@/lib/training-curriculum";

export function TrainingMilestoneActions({ milestoneKey, isPractice, isComplete, locked, actionLabel, lesson, certificationGate }: {
  milestoneKey: string;
  isPractice: boolean;
  isComplete: boolean;
  locked: boolean;
  actionLabel: string;
  lesson?: TrainingLesson | undefined;
  certificationGate: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (status: "in_progress" | "complete", onSuccess?: () => void) => startTransition(async () => {
    setError(null);
    const result = await updateTrainingProgressAction(milestoneKey, status);
    if (!result.ok) return setError(result.message);
    if (status === "in_progress" && result.href) router.push(result.href);
    else router.refresh();
    onSuccess?.();
  });

  if (locked) return <Button variant="outline" disabled className="w-full shrink-0 sm:w-auto"><LockKeyhole className="size-4" />Locked</Button>;
  return <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
    <div className="flex flex-col gap-2 sm:flex-row">
      {lesson && <Button type="button" onClick={() => { setError(null); setLessonOpen(true); }} variant="outline" className="w-full shrink-0 sm:w-auto">{isComplete ? "Review Lesson" : actionLabel}<ArrowRight className="size-4" /></Button>}
      {isPractice && !isComplete && <Button type="button" onClick={() => update("in_progress")} disabled={isPending} variant="outline" className="w-full shrink-0 sm:w-auto">{isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}{actionLabel}</Button>}
      {!isComplete && !lesson && !certificationGate && <Button type="button" onClick={() => update("complete")} disabled={isPending} className="w-full shrink-0 sm:w-auto">{isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{isPractice ? "Mark Complete" : actionLabel}</Button>}
      {isComplete && !isPractice && !lesson && <Button type="button" variant="outline" disabled className="w-full shrink-0 sm:w-auto"><Check className="size-4" />Completed</Button>}
      {isComplete && isPractice && <Button type="button" onClick={() => update("in_progress")} disabled={isPending} variant="outline" className="w-full shrink-0 sm:w-auto">Practice again<ArrowRight className="size-4" /></Button>}
    </div>
    {error && <p role="alert" className="max-w-xs text-xs font-medium text-red-700">{error}</p>}
    {lessonOpen && lesson && <TrainingLessonViewer lesson={lesson} isComplete={isComplete} isSaving={isPending} error={error} onClose={() => setLessonOpen(false)} onComplete={() => update("complete", () => setLessonOpen(false))} />}
  </div>;
}
