import type { CoreCode, EnhancementCode } from "@mercurius/domain";

export type QuoteMode = "practice" | "live";
export interface QuoteDraft {
  mode: QuoteMode;
  coreCode: CoreCode;
  enhancementCodes: EnhancementCode[];
  adSpendDollars: string;
  vendorName: string;
  vendorPain: string;
  scenarioId: string;
  notes: string;
}
