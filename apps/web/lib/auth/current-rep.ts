import type { User } from "@supabase/supabase-js";
import { adminQuery } from "@/lib/db/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface MembershipRow {
  id: string;
  organization_id: string;
  organization_name: string;
  role: "rep" | "manager" | "admin";
}

export interface CurrentRep {
  readonly user: User;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly membership: MembershipRow | null;
}

export async function getCurrentRep(): Promise<CurrentRep | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const memberships = await adminQuery<MembershipRow>(
    `select m.id, m.organization_id, m.role, o.name as organization_name
       from organization_memberships m join organizations o on o.id = m.organization_id
      where m.profile_id = $1 and m.status = 'active' order by m.created_at limit 1`,
    [user.id],
  );
  const metadata = user.user_metadata as Record<string, unknown>;
  const rawName = metadata.full_name ?? metadata.name ?? metadata.display_name;
  const rawPhone = metadata.phone ?? user.phone;
  return {
    user,
    name: typeof rawName === "string" && rawName.trim() ? rawName.trim() : user.email?.split("@")[0] ?? "Mercurius rep",
    email: user.email ?? "",
    phone: typeof rawPhone === "string" ? rawPhone : "",
    membership: memberships[0] ?? null,
  };
}
