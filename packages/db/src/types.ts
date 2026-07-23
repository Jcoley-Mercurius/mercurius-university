import type { QuoteCalculation, QuoteInput, QuoteLine } from "@mercurius/domain";

export type QuoteMode = "live" | "practice";
export type QuoteStatus = "draft" | "submitted" | "approved" | "rejected";

export interface SaveQuoteCommand {
  readonly organizationId: string;
  readonly repMembershipId: string;
  readonly idempotencyKey: string;
  readonly input: QuoteInput;
  readonly mode?: QuoteMode;
  readonly vendorId?: string;
  readonly practiceScenarioId?: string;
  readonly notes?: string;
}

export interface SavedQuote {
  readonly id: string;
  readonly organizationId: string;
  readonly repMembershipId: string;
  readonly idempotencyKey: string;
  readonly vendorId: string | null;
  readonly practiceScenarioId: string | null;
  readonly mode: QuoteMode;
  readonly status: QuoteStatus;
  readonly catalogVersion: string;
  readonly calculationHash: string;
  readonly createdAt: string;
  readonly calculation: QuoteCalculation;
  readonly lines: readonly QuoteLine[];
}

export interface QueryResult<Row> { readonly rows: readonly Row[] }

/** Minimal interface implemented by pg, postgres.js adapters, and test doubles. */
export interface Transaction {
  query<Row>(sql: string, parameters?: readonly unknown[]): Promise<QueryResult<Row>>;
}

export interface Database {
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}
