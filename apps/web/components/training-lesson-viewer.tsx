"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Check, Clock3, ExternalLink, LoaderCircle, X } from "lucide-react";
import type { TrainingLesson } from "@/lib/training-curriculum";
import { Button } from "@/components/ui/button";

export function TrainingLessonViewer({ lesson, isComplete, isSaving, error, onComplete, onClose }: {
  lesson: TrainingLesson;
  isComplete: boolean;
  isSaving: boolean;
  error: string | null;
  onComplete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#10291f]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="lesson-title" className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
      <header className="flex items-start justify-between gap-4 border-b bg-[#f5f9f7] p-5 sm:p-7">
        <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#164f3b] text-white"><BookOpen className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#347052]">Short lesson</p><span className="inline-flex items-center gap-1 text-xs text-[#6c7971]"><Clock3 className="size-3.5" />{lesson.durationMinutes} min</span>{isComplete && <span className="inline-flex items-center gap-1 rounded-full bg-[#dcece3] px-2 py-1 text-xs font-semibold text-[#246247]"><Check className="size-3" />Completed</span>}</div><h2 id="lesson-title" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{lesson.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#607068]">{lesson.summary}</p></div></div>
        <button type="button" onClick={onClose} aria-label="Close lesson" className="grid size-9 shrink-0 place-items-center rounded-full text-[#53635a] transition hover:bg-[#e5ede8]"><X className="size-5" /></button>
      </header>

      <div className="overflow-y-auto p-5 sm:p-7">
        <div className="rounded-2xl border border-[#d9e7df] bg-[#f6faf8] p-4"><h3 className="text-xs font-bold uppercase tracking-[.12em] text-[#35624c]">Key points</h3><ul className="mt-3 space-y-2">{lesson.keyPoints.map((point) => <li key={point} className="flex gap-2 text-sm leading-6 text-[#465a4f]"><Check className="mt-1 size-4 shrink-0 text-[#2a7556]" />{point}</li>)}</ul></div>
        <div className="mt-6 space-y-6">{lesson.body.map((section) => <section key={section.heading}><h3 className="text-base font-bold text-[#253b2f]">{section.heading}</h3><div className="mt-2 space-y-3">{section.content.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-[#58675f]">{paragraph}</p>)}</div></section>)}</div>
        {lesson.resourceLinks && lesson.resourceLinks.length > 0 && <div className="mt-7 border-t pt-5"><h3 className="text-xs font-bold uppercase tracking-[.12em] text-[#65736b]">Continue learning</h3><div className="mt-3 flex flex-wrap gap-2">{lesson.resourceLinks.map((resource) => <Button key={resource.href} asChild variant="outline"><Link href={resource.href} onClick={onClose}>{resource.label}<ExternalLink className="size-4" /></Link></Button>)}</div></div>}
      </div>

      <footer className="border-t bg-white p-4 sm:px-7"><div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">{error ? <p role="alert" className="text-xs font-medium text-red-700">{error}</p> : <p className="text-xs text-[#738078]">Progress is saved to your rep profile.</p>}<div className="flex gap-2"><Button type="button" variant="outline" onClick={onClose}>{isComplete ? "Continue Training" : "Close"}</Button>{!isComplete && <Button type="button" onClick={onComplete} disabled={isSaving}>{isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{isSaving ? "Saving…" : "Mark Complete & Continue"}</Button>}</div></div></footer>
    </section>
  </div>;
}
