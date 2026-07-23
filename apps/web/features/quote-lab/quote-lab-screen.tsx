"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpenCheck, CheckCircle2, FileDown, FlaskConical, GraduationCap, LayoutDashboard, LoaderCircle, LogOut, Save, Store, Target, UserRound } from "lucide-react";
import { calculateQuote, PRICING_2026_06_30, type QuoteInput } from "@mercurius/domain";
import { saveQuoteAction, type SaveQuoteUiResult } from "@/app/actions/save-quote";
import { logoutAction } from "@/app/actions/auth";
import { gradePracticeQuoteAction, type GradePracticeQuoteResult } from "@/app/actions/grade-practice-quote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalculationPanel } from "./calculation-panel";
import { CorePackageSelect } from "./core-package-select";
import { EnhancementPicker } from "./enhancement-picker";
import { GradingResults } from "@/features/practice-grading/grading-results";
import type { QuoteDraft, QuoteMode } from "./types";

const pains = [
  { value: "visibility", label: "Low online visibility", match: "Visibility Accelerator + Social Command" },
  { value: "lead-flow", label: "Inconsistent lead flow", match: "Lead Velocity + AI Marketing Co-Pilot" },
  { value: "retention", label: "Weak customer retention", match: "Retention Engine" },
  { value: "content", label: "Not enough content", match: "Content Command Suite + Video Velocity" },
  { value: "paid-growth", label: "Needs paid acquisition", match: "Ads Command" },
] as const;

const scenarios = [
  { id: "6d455243-5552-4955-b300-000000000001", name: "Dental practice growth plan", vendor: "Northstar Dental Studio", pain: "lead-flow", brief: "A growing dental practice needs stronger lead follow-up and a focused entry point." },
  { id: "6d455243-5552-4955-b300-000000000002", name: "Wellness retention challenge", vendor: "Juniper Wellness Collective", pain: "retention", brief: "A wellness collective needs better retention and a consistent social presence." },
] as const;

const initialDraftBase: Pick<QuoteDraft, "coreCode" | "enhancementCodes" | "adSpendDollars" | "notes"> = {
  coreCode: "SPARK", enhancementCodes: [], adSpendDollars: "", notes: "",
};

function createInitialDraft(mode: QuoteMode, initialScenarioId?: string): QuoteDraft {
  const scenario = scenarios.find((item) => item.id === initialScenarioId) ?? scenarios[0];
  return mode === "practice"
    ? { ...initialDraftBase, mode, vendorName: scenario.vendor, vendorPain: scenario.pain, scenarioId: scenario.id }
    : { ...initialDraftBase, mode, scenarioId: "", vendorName: "", vendorPain: "" };
}

function dollarsToCents(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;
}

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export interface RepIdentity {
  readonly name: string;
  readonly email: string;
  readonly role: "rep" | "manager" | "admin" | null;
  readonly organizationName: string | null;
  readonly hasMembership: boolean;
}

export function QuoteLabScreen({ rep, initialMode = "live", initialScenarioId }: { rep: RepIdentity; initialMode?: QuoteMode; initialScenarioId?: string | undefined }) {
  const [draft, setDraft] = useState(() => createInitialDraft(initialMode, initialScenarioId));
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [saveResult, setSaveResult] = useState<SaveQuoteUiResult | null>(null);
  const [pdfState, setPdfState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [gradeResult, setGradeResult] = useState<Extract<GradePracticeQuoteResult, { ok: true }> | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isGrading, startGrading] = useTransition();
  const adsSelected = draft.enhancementCodes.includes("ADS_COMMAND");
  const quoteInput: QuoteInput = useMemo(() => ({
    coreCode: draft.coreCode,
    enhancementCodes: draft.enhancementCodes,
    adSpendCents: adsSelected ? dollarsToCents(draft.adSpendDollars) : 0,
  }), [adsSelected, draft.adSpendDollars, draft.coreCode, draft.enhancementCodes]);
  const calculation = useMemo(() => calculateQuote(quoteInput, PRICING_2026_06_30), [quoteInput]);
  const selectedPain = pains.find((pain) => pain.value === draft.vendorPain);
  const selectedScenario = scenarios.find((scenario) => scenario.id === draft.scenarioId);
  const hasSelectedCore = PRICING_2026_06_30.cores.some((core) => core.code === draft.coreCode);
  const showGradingButton = draft.mode === "practice" && selectedScenario !== undefined && hasSelectedCore;

  useEffect(() => {
    setSaveResult(null);
    setPdfState({ loading: false, error: null });
    setGradeResult(null);
    setGradingError(null);
    setIdempotencyKey(newIdempotencyKey());
  }, [draft]);

  const updateMode = (mode: QuoteMode) => {
    setSaveResult(null);
    setDraft((current) => mode === "practice"
      ? { ...current, mode, scenarioId: scenarios[0].id, vendorName: scenarios[0].vendor, vendorPain: scenarios[0].pain }
      : { ...current, mode, scenarioId: "", vendorName: "", vendorPain: "" });
  };
  const chooseScenario = (scenarioId: string) => {
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (scenario) setDraft((current) => ({ ...current, scenarioId, vendorName: scenario.vendor, vendorPain: scenario.pain }));
  };
  const save = () => {
    setSaveResult(null);
    startSaving(async () => {
      const result = await saveQuoteAction({
        idempotencyKey, mode: draft.mode, vendorName: draft.vendorName, vendorPain: draft.vendorPain,
        quote: quoteInput, ...(draft.scenarioId ? { scenarioId: draft.scenarioId } : {}),
        ...(draft.notes.trim() ? { notes: draft.notes } : {}),
      });
      setSaveResult(result);
    });
  };
  const downloadPdf = async () => {
    setPdfState({ loading: true, error: null });
    try {
      const savedQuoteId = saveResult?.ok ? saveResult.quoteId : undefined;
      const response = savedQuoteId
        ? await fetch(`/api/quotes/${savedQuoteId}/pdf`)
        : await fetch("/api/quotes/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ calculation, vendorName: draft.vendorName }),
          });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "PDF generation failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1] ?? "mercurius-quote.pdf";
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPdfState({ loading: false, error: null });
    } catch (error) {
      setPdfState({ loading: false, error: error instanceof Error ? error.message : "PDF generation failed" });
    }
  };
  const submitForGrading = () => {
    setGradingError(null);
    startGrading(async () => {
      const result = await gradePracticeQuoteAction({ scenarioId: draft.scenarioId, quote: quoteInput });
      if (result.ok) setGradeResult(result);
      else setGradingError(result.message);
    });
  };

  return <main className={cn("min-h-screen", draft.mode === "practice" ? "pb-44 sm:pb-28" : "pb-28")}>
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#164f3b] text-white"><FlaskConical className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#777f79]">Mercurius University</p><h1 className="text-lg font-bold">Quote Lab</h1></div></div>
        <div className="flex items-center gap-2">
          <Badge className="hidden lg:inline-flex">Catalog · 2026-06-30</Badge>
          <Button asChild variant="ghost" className="min-h-10 px-3"><Link href="/dashboard"><LayoutDashboard className="size-4" /><span className="hidden md:inline">Dashboard</span></Link></Button>
          <Button asChild variant="ghost" className="min-h-10 px-3"><Link href="/training"><GraduationCap className="size-4" /><span className="hidden lg:inline">Training</span></Link></Button>
          <div className="hidden items-center gap-2 rounded-xl border bg-[#f8faf8] px-3 py-2 sm:flex">
            <span className="grid size-7 place-items-center rounded-full bg-[#e3eee8] text-[#245c45]"><UserRound className="size-4" /></span>
            <div className="max-w-40"><p className="truncate text-xs font-bold">{rep.name}</p><p className="truncate text-[11px] text-[#6e7a73]">{rep.organizationName ?? "Membership required"}</p></div>
          </div>
          <form action={logoutAction}><Button type="submit" variant="ghost" className="min-h-10 px-3" aria-label="Log out"><LogOut className="size-4" /><span className="hidden md:inline">Log out</span></Button></form>
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Build the right-fit quote</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736b]">Start with the vendor’s need, build the package, and explain every dollar with confidence.</p></div>
        <div className="inline-flex w-full rounded-xl border bg-white p-1 md:w-auto" role="group" aria-label="Quote mode">
          <ModeButton active={draft.mode === "practice"} onClick={() => updateMode("practice")} icon={<BookOpenCheck className="size-4" />}>Practice</ModeButton>
          <ModeButton active={draft.mode === "live"} onClick={() => updateMode("live")} icon={<Store className="size-4" />}>Live quote</ModeButton>
        </div>
      </div>

      {!rep.hasMembership && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div><p className="font-semibold">Your account needs an organization membership</p><p className="mt-1 text-xs leading-5">You can explore pricing, but saving is disabled. Ask an administrator to add your Auth user to <code className="font-semibold">organization_memberships</code>.</p></div>
      </div>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,.75fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader><SectionTitle number="1" title="Vendor context" detail="Anchor the quote to the vendor’s situation." /></CardHeader>
            <CardContent>
              {draft.mode === "practice" && <div className="mb-4"><FieldLabel htmlFor="scenario">Practice scenario</FieldLabel><select id="scenario" value={draft.scenarioId} onChange={(event) => chooseScenario(event.target.value)} className="input-base"><option value="" disabled>Choose a scenario</option>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select>{selectedScenario && <div className="mt-3 rounded-xl border border-[#dce5e0] bg-[#f7f9f8] p-3 text-sm leading-6 text-[#56665d]"><span className="font-semibold text-[#30463a]">Scenario brief: </span>{selectedScenario.brief}</div>}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><FieldLabel htmlFor="vendor">Vendor name</FieldLabel><input id="vendor" className="input-base" value={draft.vendorName} disabled={draft.mode === "practice"} placeholder="e.g. Harbor Dental" onChange={(event) => setDraft({ ...draft, vendorName: event.target.value })} /></div>
                <div><FieldLabel htmlFor="pain">Primary pain</FieldLabel><select id="pain" className="input-base" value={draft.vendorPain} onChange={(event) => setDraft({ ...draft, vendorPain: event.target.value })}><option value="">Select a pain</option>{pains.map((pain) => <option key={pain.value} value={pain.value}>{pain.label}</option>)}</select></div>
              </div>
              {selectedPain && <div className="mt-4 flex gap-3 rounded-xl border border-[#dbe7e0] bg-[#f3f8f5] p-3.5"><Target className="mt-0.5 size-4 shrink-0 text-[#176044]" /><div><p className="text-xs font-semibold uppercase tracking-wide text-[#5a6e62]">Match Guide starting point</p><p className="mt-1 text-sm font-semibold text-[#234735]">{selectedPain.match}</p></div></div>}
            </CardContent>
          </Card>

          <Card><CardHeader><SectionTitle number="2" title="Build the package" detail="Pricing updates instantly as selections change." /></CardHeader><CardContent className="space-y-7">
            <CorePackageSelect value={draft.coreCode} onChange={(coreCode) => setDraft({ ...draft, coreCode })} />
            <EnhancementPicker selected={draft.enhancementCodes} onChange={(enhancementCodes) => setDraft({ ...draft, enhancementCodes })} />
            {adsSelected && <div className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4"><FieldLabel htmlFor="ad-spend">Monthly ad spend <span className="font-normal text-[#766a54]">(pass-through)</span></FieldLabel><div className="relative max-w-xs"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a746d]">$</span><input id="ad-spend" inputMode="decimal" className="input-base pl-7" value={draft.adSpendDollars} placeholder="0.00" onChange={(event) => setDraft({ ...draft, adSpendDollars: event.target.value })} /></div><p className="mt-2 text-xs text-[#766a54]">Ad spend is never discounted or commissionable.</p></div>}
            <div><FieldLabel htmlFor="notes">Notes <span className="font-normal text-[#7a857e]">(optional)</span></FieldLabel><textarea id="notes" rows={3} className="input-base resize-y" placeholder="Capture relevant context for this quote…" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></div>
          </CardContent></Card>
        </div>
        <CalculationPanel calculation={calculation} />
      </div>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-3 shadow-[0_-8px_30px_rgba(25,48,36,.08)] backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
        <div className="hidden text-sm sm:block"><p className="font-semibold">{draft.vendorName || "Untitled vendor"}</p><p className="text-xs text-[#6a776f]">{draft.mode === "practice" ? "Practice quote" : "Live quote"} · {calculation.lines.length} lines</p></div>
        {(saveResult || pdfState.error || gradingError) && <p role="status" className={cn("order-first w-full min-w-0 truncate text-xs sm:order-none sm:w-auto sm:flex-1 sm:text-sm", saveResult?.ok && !pdfState.error && !gradingError ? "text-[#176044]" : "text-red-700")}>{gradingError ?? pdfState.error ?? saveResult?.message}</p>}
        <div className={cn("ml-auto grid w-full grid-cols-2 gap-2 sm:w-auto", showGradingButton && "sm:grid-cols-3")}>
        {showGradingButton && <Button
          type="button"
          className="col-span-2 sm:col-span-1 sm:min-w-44"
          disabled={isGrading || !rep.hasMembership}
          onClick={submitForGrading}
          data-testid="submit-for-grading"
        >
          {isGrading ? <LoaderCircle className="size-4 animate-spin" /> : <GraduationCap className="size-4" />}
          {isGrading ? "Grading…" : "Submit for Grading"}
        </Button>}
        <Button variant="outline" className="min-w-0 sm:min-w-36" disabled={pdfState.loading || !draft.vendorName.trim() || !rep.hasMembership} onClick={downloadPdf}>
          {pdfState.loading ? <LoaderCircle className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          {pdfState.loading ? "Generating…" : "Download PDF"}
        </Button>
        <Button variant={draft.mode === "practice" ? "outline" : "default"} className="min-w-0 sm:min-w-36" disabled={isSaving || !draft.vendorName.trim() || !rep.hasMembership || saveResult?.ok === true} onClick={save}>
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : saveResult?.ok ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
          {isSaving ? "Saving…" : saveResult?.ok ? "Saved" : "Save quote"}
        </Button>
        </div>
      </div>
    </div>
    {gradeResult && <GradingResults result={gradeResult} onDismiss={() => setGradeResult(null)} />}
  </main>;
}

function ModeButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn("flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition md:flex-none", active ? "bg-[#164f3b] text-white shadow-sm" : "text-[#5c6b63] hover:bg-[#f2f5f3]")}>{icon}{children}</button>;
}
function SectionTitle({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e5f1eb] text-xs font-bold text-[#176044]">{number}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-[#6a776f]">{detail}</p></div></div>;
}
function FieldLabel(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className="mb-1.5 block text-sm font-semibold text-[#31453a]" />;
}
