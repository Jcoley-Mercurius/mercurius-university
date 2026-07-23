import { renderToBuffer } from "@react-pdf/renderer";
import { QuoteDocument } from "./quote-document";
import type { QuotePdfData } from "./types";

export async function renderQuotePdf(data: QuotePdfData) {
  return renderToBuffer(<QuoteDocument data={data} />);
}

export function quotePdfFilename(vendorName: string, quoteId?: string | null) {
  const vendor = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "vendor";
  return `mercurius-quote-${vendor}${quoteId ? `-${quoteId.slice(0, 8)}` : "-preview"}.pdf`;
}
