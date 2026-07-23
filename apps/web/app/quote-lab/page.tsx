import { QuoteLabScreen } from "@/features/quote-lab/quote-lab-screen";
import { redirect } from "next/navigation";
import { adminQuery } from "@/lib/db/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface MembershipRow {
  role: "rep" | "manager" | "admin";
  organization_name: string;
}

export default async function QuoteLabPage({ searchParams }: { searchParams: Promise<{ mode?: string; scenario?: string; certification?: string }> }) {
  const { mode, scenario, certification } = await searchParams;
  const initialMode = mode === "practice" ? "practice" : "live";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/quote-lab");

  const memberships = await adminQuery<MembershipRow>(
    `select m.role, o.name as organization_name
       from organization_memberships m
       join organizations o on o.id = m.organization_id
      where m.profile_id = $1 and m.status = 'active'
      order by m.created_at limit 1`,
    [user.id],
  );
  const membership = memberships[0];
  const metadata = user.user_metadata as Record<string, unknown>;
  const metadataName = metadata.full_name ?? metadata.name ?? metadata.display_name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split("@")[0] ?? "Mercurius rep";

  return <QuoteLabScreen rep={{
    name,
    email: user.email ?? "",
    role: membership?.role ?? null,
    organizationName: membership?.organization_name ?? null,
    hasMembership: membership !== undefined,
  }} initialMode={initialMode} initialScenarioId={scenario} initialCertificationAttempt={certification === "1"} />;
}
