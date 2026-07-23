"use client";

import { useEffect } from "react";
import { CheckCircle2, RotateCcw, Sparkles, Target, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GradePracticeQuoteResult } from "@/app/actions/grade-practice-quote";
import { cn } from "@/lib/utils";

export function GradingResults({ result, onDismiss }: {
  result: Extract<GradePracticeQuoteResult, { ok: true }>;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onDismiss]);
  const { grade } = result;
  const tone = grade.score === 100 ? "text-[#176044]" : grade.score >= 80 ? "text-[#277457]" : grade.score >= 60 ? "text-amber-700" : "text-red-700";
  const message = grade.level === "perfect" ? "Perfect quote" : grade.level === "strong" ? "Strong recommendation" : grade.level === "developing" ? "Good foundation—keep refining" : "Let’s try this one again";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#102219]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="grade-title">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-white shadow-2xl">
      <div className="relative border-b bg-[#f5f8f6] p-6 text-center sm:p-8">
        <button type="button" onClick={onDismiss} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-[#607068] hover:bg-white" aria-label="Close grading results"><X className="size-5" /></button>
        <div className="mx-auto grid size-24 place-items-center rounded-full border-8 border-[#e1ece6] bg-white shadow-sm"><span className={cn("text-3xl font-black", tone)}>{grade.score}</span></div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[.16em] text-[#6a776f]">Practice score · out of 100</p>
        <h2 id="grade-title" className="mt-2 text-2xl font-bold">{message}</h2>
        <p className="mt-1 text-sm text-[#68766e]">{result.scenarioTitle}</p>
      </div>
      <div className="space-y-6 p-5 sm:p-7">
        <ResultSection icon={<CheckCircle2 className="size-5 text-[#176044]" />} title="What you got right" items={grade.correctDecisions} empty="Keep working through the scenario to earn your first correct decision." tone="success" />
        <ResultSection icon={<XCircle className="size-5 text-red-600" />} title="What needs improvement" items={grade.mistakes} empty="No mistakes—your recommendation matches the perfect answer." tone="error" />
        {grade.coachingNotes.length > 0 && <ResultSection icon={<Sparkles className="size-5 text-amber-600" />} title="Coaching notes" items={grade.coachingNotes} tone="coach" />}
        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6b786f]">Dismiss to adjust your quote and submit again.</p>
          <Button autoFocus onClick={onDismiss}><RotateCcw className="size-4" />Try again</Button>
        </div>
      </div>
    </div>
  </div>;
}

function ResultSection({ icon, title, items, empty, tone }: {
  icon: React.ReactNode; title: string; items: readonly string[]; empty?: string; tone: "success" | "error" | "coach";
}) {
  const colors = tone === "success" ? "bg-[#f1f7f3] border-[#dbe9e1]" : tone === "error" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100";
  return <section className={cn("rounded-xl border p-4", colors)}><div className="mb-3 flex items-center gap-2">{icon}<h3 className="font-bold">{title}</h3></div>{items.length > 0 ? <ul className="space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-5 text-[#405047]"><Target className="mt-1 size-3 shrink-0" />{item}</li>)}</ul> : <p className="text-sm text-[#607068]">{empty}</p>}</section>;
}
