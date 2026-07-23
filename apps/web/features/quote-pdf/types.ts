import type { QuoteCalculation } from "@mercurius/domain";

export interface QuotePdfData {
  readonly calculation: QuoteCalculation;
  readonly vendorName: string;
  readonly generatedAt: string;
  readonly quoteId: string | null;
  readonly rep: {
    readonly name: string;
    readonly email: string;
    readonly phone?: string;
  };
}
