import type { QuoteCalculation } from "@mercurius/domain";
import { adminQuery } from "@/lib/db/server";
import { getCurrentRep } from "@/lib/auth/current-rep";
import { quotePdfFilename, renderQuotePdf } from "@/features/quote-pdf/render-quote-pdf";
import { isQuoteCalculation } from "@/features/quote-pdf/validation";

export const runtime = "nodejs";

interface SavedQuoteRow {
  id: string;
  created_at: string | Date;
  vendor_name: string;
  canonical_output_json: QuoteCalculation;
}

export async function GET(_request: Request, context: { params: Promise<{ quoteId: string }> }) {
  const rep = await getCurrentRep();
  if (!rep) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!rep.membership) return Response.json({ error: "Active organization membership required" }, { status: 403 });
  const { quoteId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(quoteId)) return Response.json({ error: "Invalid quote ID" }, { status: 400 });

  const rows = await adminQuery<SavedQuoteRow>(
    `select q.id, q.created_at, s.canonical_output_json,
            coalesce(v.display_name, ps.vendor_json->>'displayName', ps.title, 'Vendor') as vendor_name
       from quotes q
       join quote_calculation_snapshots s on s.quote_id = q.id
       left join vendors v on v.id = q.vendor_id
       left join practice_scenarios ps on ps.id = q.practice_scenario_id
      where q.id = $1 and q.organization_id = $2
        and (q.rep_membership_id = $3 or $4 = 'admin' or exists (
          select 1 from organization_memberships owner
           where owner.id = q.rep_membership_id and owner.manager_membership_id = $3
        ))`,
    [quoteId, rep.membership.organization_id, rep.membership.id, rep.membership.role],
  );
  const quote = rows[0];
  if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });
  if (!isQuoteCalculation(quote.canonical_output_json)) {
    return Response.json({ error: "Saved quote snapshot is invalid" }, { status: 500 });
  }

  const buffer = await renderQuotePdf({
    calculation: quote.canonical_output_json,
    vendorName: quote.vendor_name,
    generatedAt: new Date(quote.created_at).toISOString(),
    quoteId: quote.id,
    rep: { name: rep.name, email: rep.email, ...(rep.phone ? { phone: rep.phone } : {}) },
  });
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${quotePdfFilename(quote.vendor_name, quote.id)}"`,
    "Cache-Control": "private, no-store",
  } });
}
