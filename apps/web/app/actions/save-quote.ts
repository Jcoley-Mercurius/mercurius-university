"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { saveQuote } from "@mercurius/db";
import { sha256, type QuoteInput } from "@mercurius/domain";
import { adminQuery, database } from "@/lib/db/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveQuoteUiInput {
  readonly idempotencyKey: string;
  readonly mode: "live" | "practice";
  readonly vendorName: string;
  readonly vendorPain: string;
  readonly scenarioId?: string;
  readonly notes?: string;
  readonly quote: QuoteInput;
}

export interface SaveQuoteUiResult {
  readonly ok: boolean;
  readonly message: string;
  readonly quoteId?: string;
}

interface MembershipRow { id: string; organization_id: string }

function stableUuid(source: string) {
  const hex = sha256(source).slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = (["8", "9", "a", "b"])[parseInt(hex[16] ?? "0", 16) % 4] ?? "8";
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export async function saveQuoteAction(request: SaveQuoteUiInput): Promise<SaveQuoteUiResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to save this quote. Your draft is still here." };

    const memberships = await adminQuery<MembershipRow>(
      `select id, organization_id from organization_memberships
        where profile_id = $1 and status = 'active' order by created_at limit 1`,
      [user.id],
    );
    const membership = memberships[0];
    if (!membership) return { ok: false, message: "Your account does not have an active Mercurius membership." };

    let vendorId: string | undefined;
    let scenarioId: string | undefined;
    if (request.mode === "live") {
      if (!request.vendorName.trim()) return { ok: false, message: "Add a vendor name before saving a live quote." };
      vendorId = stableUuid(`${membership.id}:${request.idempotencyKey}:vendor`);
      await adminQuery(
        `insert into vendors (id, organization_id, owner_membership_id, display_name, category, fictional, metadata_json)
         values ($1,$2,$3,$4,'Quote Lab',false,$5::jsonb)
         on conflict (id) do update set display_name = excluded.display_name,
           metadata_json = excluded.metadata_json, updated_at = now(), version = vendors.version + 1`,
        [vendorId, membership.organization_id, membership.id, request.vendorName.trim(),
         JSON.stringify({ pain: request.vendorPain, source: "quote_lab" })],
      );
    } else {
      scenarioId = request.scenarioId;
      if (!scenarioId) return { ok: false, message: "Choose a practice scenario before saving." };
    }

    const saved = await saveQuote(database, {
      organizationId: membership.organization_id,
      repMembershipId: membership.id,
      idempotencyKey: request.idempotencyKey || randomUUID(),
      input: request.quote,
      mode: request.mode,
      ...(vendorId ? { vendorId } : {}),
      ...(scenarioId ? { practiceScenarioId: scenarioId } : {}),
      ...(request.notes?.trim() ? { notes: request.notes.trim() } : {}),
    });
    revalidatePath("/quote-lab");
    return { ok: true, quoteId: saved.id, message: "Quote saved successfully." };
  } catch (error) {
    console.error("Quote save failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Quote could not be saved." };
  }
}
