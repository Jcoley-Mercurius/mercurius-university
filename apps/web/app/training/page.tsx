import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  Check,
  Circle,
  Clock3,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Play,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentRep } from "@/lib/auth/current-rep";

type MilestoneStatus = "not-started" | "in-progress" | "complete";

interface Milestone {
  readonly title: string;
  readonly description: string;
  readonly status: MilestoneStatus;
  readonly action: string;
  readonly href?: string;
}

interface TrainingModule {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly milestones: readonly Milestone[];
}

const modules: readonly TrainingModule[] = [
  {
    title: "Platform Orientation",
    description: "Learn the Mercurius workflow and the tools you will use every day.",
    icon: <LayoutDashboard className="size-5" />,
    milestones: [
      { title: "Welcome to Mercurius University", description: "Understand your ramp path and success standards.", status: "complete", action: "Review" },
      { title: "Navigate your rep workspace", description: "Tour the Dashboard, Training Hub, and Quote Lab.", status: "complete", action: "Review", href: "/dashboard" },
      { title: "Set your first learning goal", description: "Choose the skill you want to strengthen first.", status: "in-progress", action: "Continue" },
    ],
  },
  {
    title: "Product & Packaging Mastery",
    description: "Build confidence in core packages, enhancements, and positioning.",
    icon: <Sparkles className="size-5" />,
    milestones: [
      { title: "Core package foundations", description: "Know when Spark, Momentum, and higher tiers fit.", status: "in-progress", action: "Continue" },
      { title: "Software vs. service enhancements", description: "Explain the packaging rules without jargon.", status: "not-started", action: "Start" },
      { title: "Pricing and earnings essentials", description: "Read totals, discounts, commission, and residuals.", status: "not-started", action: "Start" },
    ],
  },
  {
    title: "Discovery & Match Guide",
    description: "Turn vendor pain into a focused, defensible recommendation.",
    icon: <Target className="size-5" />,
    milestones: [
      { title: "Lead a useful discovery", description: "Ask questions that uncover the business problem.", status: "not-started", action: "Start" },
      { title: "Map pain to solutions", description: "Use the Match Guide to avoid over- or under-selling.", status: "not-started", action: "Start" },
      { title: "Practice recommendation language", description: "Connect every package decision to vendor value.", status: "not-started", action: "Start practice", href: "/quote-lab?mode=practice" },
    ],
  },
  {
    title: "Quote Lab Mastery",
    description: "Build accurate quotes and communicate their value with confidence.",
    icon: <FlaskConical className="size-5" />,
    milestones: [
      { title: "Build a complete practice quote", description: "Select a core, enhancements, and the right structure.", status: "not-started", action: "Open Quote Lab", href: "/quote-lab?mode=practice" },
      { title: "Explain discounts and totals", description: "Walk through each line and calculation clearly.", status: "not-started", action: "Start practice", href: "/quote-lab?mode=practice" },
      { title: "Master the earnings conversation", description: "Understand upfront and Month 2 residuals.", status: "not-started", action: "Start practice", href: "/quote-lab?mode=practice" },
    ],
  },
  {
    title: "Practice Scenarios & Certification",
    description: "Apply the full sales motion and demonstrate quote readiness.",
    icon: <GraduationCap className="size-5" />,
    milestones: [
      { title: "Dental growth scenario", description: "Diagnose the need and submit a graded recommendation.", status: "not-started", action: "Begin scenario", href: "/quote-lab?mode=practice" },
      { title: "Wellness retention scenario", description: "Build a retention-focused package and get feedback.", status: "not-started", action: "Begin scenario", href: "/quote-lab?mode=practice" },
      { title: "Quote readiness certification", description: "Complete the final assessment when prerequisites are met.", status: "not-started", action: "Locked" },
    ],
  },
] as const;

export default async function TrainingPage() {
  const rep = await getCurrentRep();
  if (!rep) redirect("/login?next=/training");

  const milestones = modules.flatMap((module) => module.milestones);
  const completed = milestones.filter((milestone) => milestone.status === "complete").length;
  const inProgress = milestones.filter((milestone) => milestone.status === "in-progress").length;
  const progress = Math.round((completed / milestones.length) * 100);

  return <main className="min-h-screen pb-12">
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#164f3b] text-white"><GraduationCap className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#777f79]">Mercurius University</p><h1 className="text-lg font-bold">Training Hub</h1></div></div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" className="min-h-10 px-3"><Link href="/dashboard"><LayoutDashboard className="size-4" /><span className="hidden lg:inline">Dashboard</span></Link></Button>
          <Button asChild variant="ghost" className="min-h-10 px-3"><Link href="/quote-lab?mode=live"><FlaskConical className="size-4" /><span className="hidden lg:inline">Quote Lab</span></Link></Button>
          <div className="hidden items-center gap-2 rounded-xl border bg-[#f8faf8] px-3 py-2 md:flex"><span className="grid size-7 place-items-center rounded-full bg-[#e3eee8] text-[#245c45]"><UserRound className="size-4" /></span><div className="max-w-36"><p className="truncate text-xs font-bold">{rep.name}</p><p className="truncate text-[11px] text-[#6e7a73]">{rep.membership?.organization_name ?? "Membership required"}</p></div></div>
          <form action={logoutAction}><Button type="submit" variant="ghost" className="min-h-10 px-3" aria-label="Log out"><LogOut className="size-4" /><span className="hidden lg:inline">Log out</span></Button></form>
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      <section className="grid gap-5 overflow-hidden rounded-2xl bg-[#164f3b] p-6 text-white shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div><Badge className="bg-white/12 text-[#eaf5ef]">Your learning path</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">Build confidence, one milestone at a time.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#d6e7dd]">Continue your personalized ramp, practice real vendor situations, and prepare for certification.</p></div>
        <Button asChild className="w-fit bg-white text-[#164f3b] hover:bg-[#eef5f1]"><Link href="/quote-lab?mode=practice"><Play className="size-4" />Start practice</Link></Button>
      </section>

      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#64736b]">Overall progress</p><p className="mt-2 text-3xl font-black tracking-tight">{progress}% complete</p><p className="mt-1 text-sm text-[#6b776f]">{completed} complete · {inProgress} in progress · {milestones.length} total milestones</p></div><p className="text-sm font-semibold text-[#287054]">Keep going, {rep.name.split(" ")[0]}.</p></div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8eeea]" role="progressbar" aria-label="Training progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-[#2c7a59] transition-[width]" style={{ width: `${progress}%` }} /></div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4" aria-labelledby="modules-heading">
          <div><h2 id="modules-heading" className="text-xl font-bold">Learning modules</h2><p className="mt-1 text-sm text-[#6b776f]">Work at your pace. Your next useful action is always one click away.</p></div>
          {modules.map((module, index) => <ModuleCard key={module.title} module={module} number={index + 1} />)}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6" aria-label="Coaching tools">
          <Card className="overflow-hidden border-[#cbded2]">
            <div className="bg-gradient-to-br from-[#e8f3ed] to-[#f8fbf9] p-6"><span className="grid size-12 place-items-center rounded-2xl bg-[#164f3b] text-white"><Bot className="size-6" /></span><Badge className="mt-5 bg-[#dcece3] text-[#245e46]">Coming soon</Badge><h2 className="mt-3 text-xl font-bold">Live Avatar Coach</h2><p className="mt-2 text-sm leading-6 text-[#5e6e65]">Practice discovery, objections, and quote presentation in a live coaching conversation.</p></div>
            <CardContent className="pt-5"><div className="space-y-3 text-sm"><AvatarFeature text="Role-play realistic vendor conversations" /><AvatarFeature text="Get feedback in the moment" /><AvatarFeature text="Turn coaching into your next milestone" /></div><Button disabled className="mt-5 w-full"><LockKeyhole className="size-4" />Avatar sessions coming soon</Button></CardContent>
          </Card>
          <Card><CardContent className="pt-5 sm:pt-6"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf3fb] text-[#365b80]"><BookOpenCheck className="size-4" /></span><div><h3 className="font-bold">Practice makes progress</h3><p className="mt-1 text-xs leading-5 text-[#69766f]">Use graded scenarios to turn package knowledge into repeatable sales judgment.</p><Link href="/quote-lab?mode=practice" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#246247] hover:underline">Open Practice Mode<ArrowRight className="size-4" /></Link></div></div></CardContent></Card>
        </aside>
      </div>
    </div>
  </main>;
}

function ModuleCard({ module, number }: { module: TrainingModule; number: number }) {
  const complete = module.milestones.filter((milestone) => milestone.status === "complete").length;
  return <Card>
    <CardHeader><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f2ec] text-[#1c6348]">{module.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#7b877f]">Module {number}</p><Badge>{complete}/{module.milestones.length} complete</Badge></div><h3 className="mt-1 text-lg font-bold">{module.title}</h3><p className="mt-1 text-sm leading-6 text-[#6b776f]">{module.description}</p></div></div></CardHeader>
    <CardContent><div className="divide-y rounded-xl border">{module.milestones.map((milestone) => <MilestoneRow key={milestone.title} milestone={milestone} />)}</div></CardContent>
  </Card>;
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const status = statusDetails[milestone.status];
  return <div className="flex flex-col gap-3 bg-white p-4 first:rounded-t-xl last:rounded-b-xl sm:flex-row sm:items-center">
    <span className={`grid size-8 shrink-0 place-items-center rounded-full ${status.iconClass}`}>{status.icon}</span>
    <div className="min-w-0 flex-1"><p className="font-semibold">{milestone.title}</p><p className="mt-1 text-xs leading-5 text-[#6b776f]">{milestone.description}</p><p className={`mt-1 text-xs font-semibold ${status.textClass}`}>{status.label}</p></div>
    {milestone.href ? <Button asChild variant={milestone.status === "in-progress" ? "default" : "outline"} className="w-full shrink-0 sm:w-auto"><Link href={milestone.href}>{milestone.action}<ArrowRight className="size-4" /></Link></Button> : <Button variant="outline" disabled={milestone.action === "Locked"} className="w-full shrink-0 sm:w-auto">{milestone.action}{milestone.action === "Locked" ? <LockKeyhole className="size-4" /> : <ArrowRight className="size-4" />}</Button>}
  </div>;
}

const statusDetails: Record<MilestoneStatus, { label: string; icon: React.ReactNode; iconClass: string; textClass: string }> = {
  complete: { label: "Complete", icon: <Check className="size-4" />, iconClass: "bg-[#dcece3] text-[#246247]", textClass: "text-[#287054]" },
  "in-progress": { label: "In progress", icon: <Clock3 className="size-4" />, iconClass: "bg-[#fff0d8] text-[#8b5c14]", textClass: "text-[#8b5c14]" },
  "not-started": { label: "Not started", icon: <Circle className="size-4" />, iconClass: "bg-[#eef1ef] text-[#77837c]", textClass: "text-[#77837c]" },
};

function AvatarFeature({ text }: { text: string }) {
  return <div className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#2c7959]" /><span className="text-[#5f6e66]">{text}</span></div>;
}
