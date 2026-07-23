"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action] = useActionState(loginAction, initialState);
  return <form action={action} className="space-y-4">
    <input type="hidden" name="next" value={nextPath} />
    <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#31453a]">Work email</label><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7d8982]" /><input id="email" name="email" type="email" autoComplete="email" required autoFocus className="input-base pl-10" placeholder="you@mercurius.com" /></div></div>
    <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="password" className="text-sm font-semibold text-[#31453a]">Password</label><span className="text-xs text-[#78837d]">Supabase-managed</span></div><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7d8982]" /><input id="password" name="password" type="password" autoComplete="current-password" required className="input-base pl-10" placeholder="Enter your password" /></div></div>
    {state.error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{state.error}</span></div>}
    <SubmitButton />
  </form>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Signing in…" : "Sign in"}{!pending && <ArrowRight className="size-4" />}</Button>;
}
