import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenCheck, FileDown, FlaskConical, GraduationCap, History, LogOut, Plus, ReceiptText, Trophy, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentRep } from "@/lib/auth/current-rep";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface DashboardQuoteRow {
  id: string;
  created_at: string;
  monthly_total_cents: number;
  mode: "live" | "practice";
  status: string;
  vendor_id: string | null;
  practice_scenario_id: string | null;
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function vendorName(quote: DashboardQuoteRow) {
  return quote.mode === "practice" ? "Practice Scenario" : "Vendor";
}

export default async function DashboardPage() {
  const rep = await getCurrentRep();
  if (!rep) redirect("/login?next=/dashboard");

  let quotes: DashboardQuoteRow[] = [];
  let practiceAttempts = 0;
  let loadError: string | null = null;
  if (rep.membership) {
    const supabase = await createSupabaseServerClient();
    const [recentResult, practiceResult] = await Promise.all([
      supabase.from("quotes")
        .select("id, created_at, monthly_total_cents, mode, status, vendor_id, practice_scenario_id")
        .eq("rep_membership_id", rep.membership.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("quotes").select("id", { count: "exact", head: true })
        .eq("rep_membership_id", rep.membership.id).eq("mode", "practice"),
    ]);
    if (recentResult.error || practiceResult.error) {
      loadError = "Dashboard activity could not be loaded. Please refresh or try again shortly.";
      console.error("Dashboard query failed", recentResult.error ?? practiceResult.error);
    } else {
      quotes = (recentResult.data ?? []) as unknown as DashboardQuoteRow[];
      practiceAttempts = practiceResult.count ?? 0;
    }
  }

  return <main className="min-h-screen pb-12">
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#164f3b] text-white"><FlaskConical className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#777f79]">Mercurius University</p><h1 className="text-lg font-bold">Rep Dashboard</h1></div></div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="min-h-10 px-3"><Link href="/quote-lab?mode=live"><FlaskConical className="size-4" /><span className="hidden lg:inline">Quote Lab</span></Link></Button>
          <Button asChild variant="ghost" className="min-h-10 px-3"><Link href="/training"><GraduationCap className="size-4" /><span className="hidden lg:inline">Training</span></Link></Button>
          <div className="hidden items-center gap-2 rounded-xl border bg-[#f8faf8] px-3 py-2 sm:flex"><span className="grid size-7 place-items-center rounded-full bg-[#e3eee8] text-[#245c45]"><UserRound className="size-4" /></span><div className="max-w-44"><p className="truncate text-xs font-bold">{rep.name}</p><p className="truncate text-[11px] text-[#6e7a73]">{rep.membership?.organization_name ?? "Membership required"}</p></div></div>
          <form action={logoutAction}><Button type="submit" variant="ghost" className="min-h-10 px-3" aria-label="Log out"><LogOut className="size-4" /><span className="hidden md:inline">Log out</span></Button></form>
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-sm font-semibold text-[#287054]">Welcome back, {rep.name.split(" ")[0]}</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Ready to build momentum?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736b]">Create a vendor quote or sharpen your recommendation skills in Practice Mode.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button asChild variant="outline"><Link href="/quote-lab?mode=practice"><BookOpenCheck className="size-4" />Practice Mode</Link></Button>
          <Button asChild><Link href="/quote-lab?mode=live"><Plus className="size-4" />New Quote</Link></Button>
        </div>
      </section>

      {!rep.membership && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Your account needs an organization membership</p><p className="mt-1 text-xs leading-5">Ask an administrator to add your Auth user before saving quotes or tracking activity.</p></div>}
      {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Rep overview">
        <SummaryCard icon={<ReceiptText className="size-5" />} label="Saved quotes" value={quotes.length === 8 ? "8+" : String(quotes.length)} detail="Recent activity" />
        <SummaryCard icon={<BookOpenCheck className="size-5" />} label="Practice attempts" value={String(practiceAttempts)} detail="Saved practice quotes" />
        <SummaryCard icon={<Trophy className="size-5" />} label="Highest score" value="—" detail="Score history is not recorded yet" />
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Recent quotes</h2><p className="mt-1 text-sm text-[#6a776f]">Your eight most recently saved quotes.</p></div><History className="size-5 text-[#607168]" /></CardHeader>
        <CardContent>
          {quotes.length === 0 ? <EmptyQuotes /> : <div className="divide-y overflow-hidden rounded-xl border">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_120px_140px_100px_44px] gap-4 bg-[#f4f7f5] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#68766e] md:grid"><span>Vendor</span><span>Date</span><span>Monthly</span><span>Mode</span><span className="sr-only">PDF</span></div>
            {quotes.map((quote) => <article key={quote.id} className="grid gap-3 bg-white px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_120px_140px_100px_44px] md:items-center md:gap-4">
              <div className="min-w-0"><p className="truncate font-semibold">{vendorName(quote)}</p><p className="mt-1 truncate text-xs text-[#758179]">Quote {quote.id.slice(0, 8)} · {quote.status}</p></div>
              <p className="text-sm text-[#5f6d65]"><span className="mr-2 text-xs font-semibold uppercase text-[#8a958f] md:hidden">Date</span>{date.format(new Date(quote.created_at))}</p>
              <p className="text-sm font-bold"><span className="mr-2 text-xs font-semibold uppercase text-[#8a958f] md:hidden">Monthly</span>{money.format(quote.monthly_total_cents / 100)}</p>
              <Badge className={quote.mode === "practice" ? "w-fit bg-[#edf3fb] text-[#365b80]" : "w-fit bg-[#edf5f0] text-[#2f624b]"}>{quote.mode === "practice" ? "Practice" : "Live"}</Badge>
              <Button asChild variant="ghost" className="w-fit px-3 md:size-10 md:px-0" title="Download quote PDF"><a href={`/api/quotes/${quote.id}/pdf`}><FileDown className="size-4" /><span className="md:sr-only">Download PDF</span></a></Button>
            </article>)}
          </div>}
        </CardContent>
      </Card>
    </div>
  </main>;
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <Card><CardContent className="flex items-center gap-4 py-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f2ec] text-[#1c6348]">{icon}</span><div><p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p><p className="mt-0.5 text-xs text-[#7a867f]">{detail}</p></div></CardContent></Card>;
}

function EmptyQuotes() {
  return <div className="grid place-items-center rounded-xl border border-dashed bg-[#fafcfb] px-5 py-12 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#e9f2ed] text-[#29654d]"><ReceiptText className="size-6" /></span><h3 className="mt-4 font-bold">No saved quotes yet</h3><p className="mt-1 max-w-sm text-sm leading-6 text-[#6a776f]">Create your first live quote or complete a practice scenario. It will appear here automatically.</p><Button asChild className="mt-5"><Link href="/quote-lab?mode=live">Create first quote<ArrowRight className="size-4" /></Link></Button></div>;
}
