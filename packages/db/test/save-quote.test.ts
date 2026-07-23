import { PRICING_2026_06_30, calculateQuote, type QuoteInput } from "@mercurius/domain";
import { describe, expect, it } from "vitest";
import { saveQuote } from "../src/save-quote.js";
import type { Database, QueryResult, Transaction } from "../src/types.js";

const input: QuoteInput = {
  coreCode: "SPARK",
  enhancementCodes: ["AI_MARKETING_COPILOT"],
  adSpendCents: 0,
};
const calculation = calculateQuote(input, PRICING_2026_06_30);
const quoteId = "10000000-0000-4000-8000-000000000001";

function aggregateRow() {
  return {
    id: quoteId,
    organization_id: "20000000-0000-4000-8000-000000000001",
    rep_membership_id: "30000000-0000-4000-8000-000000000001",
    idempotency_key: "attempt-1",
    vendor_id: "40000000-0000-4000-8000-000000000001",
    practice_scenario_id: null,
    mode: "live" as const,
    status: "draft" as const,
    catalog_version: calculation.catalogVersion,
    calculation_hash: calculation.calculationHash,
    created_at: "2026-07-19T12:00:00.000Z",
    canonical_output_json: calculation,
  };
}

class RecordingDb implements Database, Transaction {
  readonly statements: string[] = [];
  committed = false;
  constructor(private readonly retry = false, private readonly hash = calculation.calculationHash) {}

  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const result = await work(this);
    this.committed = true;
    return result;
  }

  async query<Row>(sql: string): Promise<QueryResult<Row>> {
    this.statements.push(sql);
    if (sql.startsWith("insert into quotes")) {
      return { rows: (this.retry ? [] : [{ id: quoteId }]) as Row[] };
    }
    if (sql.startsWith("select id, calculation_hash")) {
      return { rows: [{ id: quoteId, calculation_hash: this.hash }] as Row[] };
    }
    if (sql.startsWith("select q.*")) return { rows: [aggregateRow()] as Row[] };
    return { rows: [] };
  }
}

const command = {
  organizationId: "20000000-0000-4000-8000-000000000001",
  repMembershipId: "30000000-0000-4000-8000-000000000001",
  vendorId: "40000000-0000-4000-8000-000000000001",
  idempotencyKey: "attempt-1",
  input,
} as const;

describe("saveQuote", () => {
  it("recalculates and atomically writes a quote, every line, and one snapshot", async () => {
    const db = new RecordingDb();
    const saved = await saveQuote(db, command);

    expect(db.committed).toBe(true);
    expect(saved.calculationHash).toBe(calculation.calculationHash);
    expect(saved.catalogVersion).toBe("2026-06-30");
    expect(db.statements.filter((sql) => sql.startsWith("insert into quote_lines")))
      .toHaveLength(calculation.lines.length);
    expect(db.statements.filter((sql) => sql.startsWith("insert into quote_calculation_snapshots")))
      .toHaveLength(1);
  });

  it("returns the original quote when the idempotency key and calculation match", async () => {
    const db = new RecordingDb(true);
    const saved = await saveQuote(db, command);

    expect(saved.id).toBe(quoteId);
    expect(db.statements.some((sql) => sql.startsWith("insert into quote_lines"))).toBe(false);
    expect(db.statements.some((sql) => sql.startsWith("insert into quote_calculation_snapshots"))).toBe(false);
  });

  it("rejects reuse of an idempotency key for different calculation content", async () => {
    const db = new RecordingDb(true, "0".repeat(64));
    await expect(saveQuote(db, command)).rejects.toThrow(/different quote calculation/);
    expect(db.committed).toBe(false);
  });
});
