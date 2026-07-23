import type { QuoteCalculation } from "@mercurius/domain";
import { getCurrentRep } from "@/lib/auth/current-rep";
import { quotePdfFilename, renderQuotePdf } from "@/features/quote-pdf/render-quote-pdf";
import { isQuoteCalculation } from "@/features/quote-pdf/validation";

export const runtime = "nodejs";

interface RequestBody { calculation?: QuoteCalculation; vendorName?: string }

export async function POST(request: Request) {
  const rep = await getCurrentRep();
  if (!rep) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!rep.membership) return Response.json({ error: "Active organization membership required" }, { status: 403 });

  let body: RequestBody;
  try { body = await request.json() as RequestBody; }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const vendorName = body.vendorName?.trim();
  if (!vendorName || vendorName.length > 160 || !isQuoteCalculation(body.calculation)) {
    return Response.json({ error: "A valid vendor and quote calculation are required" }, { status: 400 });
  }

  const buffer = await renderQuotePdf({
    calculation: body.calculation,
    vendorName,
    generatedAt: new Date().toISOString(),
    quoteId: null,
    rep: { name: rep.name, email: rep.email, ...(rep.phone ? { phone: rep.phone } : {}) },
  });
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${quotePdfFilename(vendorName)}"`,
    "Cache-Control": "private, no-store",
  } });
}
