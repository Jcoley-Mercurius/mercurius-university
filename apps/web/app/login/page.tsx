import { FlaskConical, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/quote-lab");
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/quote-lab";

  return <main className="grid min-h-screen place-items-center px-4 py-10">
    <div className="w-full max-w-md">
      <div className="mb-7 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#164f3b] text-white shadow-sm"><FlaskConical className="size-6" /></span><p className="mt-4 text-xs font-semibold uppercase tracking-[.2em] text-[#68766e]">Mercurius University</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-[#68766e]">Sign in to build, save, and revisit accurate vendor quotes.</p></div>
      <Card className="shadow-[0_16px_50px_rgba(27,55,40,.08)]"><CardHeader><h2 className="text-lg font-bold">Rep sign in</h2><p className="mt-1 text-sm text-[#6a776f]">Use the account assigned to your organization.</p></CardHeader><CardContent><LoginForm nextPath={nextPath} /></CardContent></Card>
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#748078]"><ShieldCheck className="size-4" />Secure authentication powered by Supabase</p>
    </div>
  </main>;
}
