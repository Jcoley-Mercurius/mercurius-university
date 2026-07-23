import { AlertCircle, BadgeDollarSign, CalendarClock } from "lucide-react";
import type { QuoteCalculation } from "@mercurius/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dollars = (cents: number) => currency.format(cents / 100);
const percent = (bps: number) => `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;

export function CalculationPanel({ calculation }: { calculation: QuoteCalculation }) {
  return <div className="space-y-4 lg:sticky lg:top-5">
    <Card className="overflow-hidden border-[#cad8d0]">
      <CardHeader className="border-b bg-[#173f31] text-white">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#b9d2c6]">Live calculation</p><h2 className="mt-1 text-xl font-semibold">Quote summary</h2></div>
          <Badge className="bg-white/10 text-white">USD</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="One-time" value={dollars(calculation.totals.setupCents)} />
          <Metric label="Monthly" value={dollars(calculation.totals.monthlyCents)} accent />
        </div>

        <div className="my-5 border-t" />
        <div className="space-y-4">
          {calculation.lines.map((line) => <div key={`${line.kind}-${line.productCode}`} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{line.productName}</p><p className="text-xs text-[#6b786f]">{line.kind === "core" ? "Core package" : line.classification.replace("_", " ")}</p></div>
            <p className="text-sm font-semibold">{dollars(line.finalMonthlyCents)}<span className="font-normal text-[#718078]">/mo</span></p>
            <div className="col-span-2 rounded-lg bg-[#f5f7f5] px-3 py-2 text-xs leading-5 text-[#5c6c63]">
              {line.appliedDiscountBps > 0 && <span className="mr-2 font-bold text-[#176044]">−{percent(line.appliedDiscountBps)}</span>}
              {line.explanation}
            </div>
          </div>)}
        </div>

        <div className="my-5 border-t" />
        <div className="rounded-xl bg-[#f1f7f3] p-4">
          <div className="mb-3 flex items-center gap-2"><BadgeDollarSign className="size-5 text-[#176044]" /><h3 className="font-semibold">Your earnings</h3></div>
          <Earning label="Upfront commission" value={dollars(calculation.totals.upfrontCommissionCents)} />
          <Earning label="Monthly residual" value={dollars(calculation.totals.monthlyResidualCents)} />
          <div className="my-2 border-t border-[#cadcd2]" />
          <Earning label="Year-1 estimate" value={dollars(calculation.totals.yearOneEarningsCents)} strong />
        </div>
      </CardContent>
    </Card>

    {calculation.warnings.some((warning) => warning.code === "NO_ENHANCEMENTS") && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertCircle className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Core-only quote</p><p className="mt-1 text-xs leading-5">This is valid. Before saving, confirm you explored the vendor’s enhancement needs.</p></div>
    </div>}
    <div className="flex gap-3 rounded-xl border border-[#d9e3ef] bg-[#f4f7fb] p-4 text-sm text-[#344b66]">
      <CalendarClock className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Residuals begin in Month 2</p><p className="mt-1 text-xs leading-5">The monthly residual shown above begins after the vendor’s first month.</p></div>
    </div>
  </div>;
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={accent ? "rounded-xl bg-[#e7f2ec] p-3" : "rounded-xl bg-[#f4f6f4] p-3"}><p className="text-xs text-[#68776e]">{label}</p><p className="mt-1 text-xl font-bold tracking-tight">{value}</p></div>;
}
function Earning({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-3 py-1.5 text-sm"><span className={strong ? "font-semibold" : "text-[#596b61]"}>{label}</span><span className={strong ? "text-base font-bold text-[#154d39]" : "font-semibold"}>{value}</span></div>;
}
