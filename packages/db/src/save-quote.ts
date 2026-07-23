import {
  PRICING_2026_06_30,
  calculateQuote,
  canonicalJson,
  type PricingCatalog,
  type QuoteCalculation,
} from "@mercurius/domain";
import type { Database, SaveQuoteCommand, SavedQuote, Transaction } from "./types";

interface QuoteRow {
  id: string;
  organization_id: string;
  rep_membership_id: string;
  idempotency_key: string;
  vendor_id: string | null;
  practice_scenario_id: string | null;
  mode: SavedQuote["mode"];
  status: SavedQuote["status"];
  catalog_version: string;
  calculation_hash: string;
  created_at: string | Date;
}

function required(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

async function loadSavedQuote(tx: Transaction, id: string): Promise<SavedQuote> {
  const result = await tx.query<QuoteRow & { canonical_output_json: QuoteCalculation }>(
    `select q.*, s.canonical_output_json
       from quotes q
       join quote_calculation_snapshots s on s.quote_id = q.id
      where q.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Saved quote could not be reloaded");
  return {
    id: row.id,
    organizationId: row.organization_id,
    repMembershipId: row.rep_membership_id,
    idempotencyKey: row.idempotency_key,
    vendorId: row.vendor_id,
    practiceScenarioId: row.practice_scenario_id,
    mode: row.mode,
    status: row.status,
    catalogVersion: row.catalog_version,
    calculationHash: row.calculation_hash,
    createdAt: new Date(row.created_at).toISOString(),
    calculation: row.canonical_output_json,
    lines: row.canonical_output_json.lines,
  };
}

export async function saveQuote(
  db: Database,
  command: SaveQuoteCommand,
  catalog: PricingCatalog = PRICING_2026_06_30,
): Promise<SavedQuote> {
  const organizationId = required(command.organizationId, "organizationId");
  const repMembershipId = required(command.repMembershipId, "repMembershipId");
  const idempotencyKey = required(command.idempotencyKey, "idempotencyKey");
  if (idempotencyKey.length > 128) throw new Error("idempotencyKey is too long");
  const mode = command.mode ?? "live";
  if (mode === "live" && !command.vendorId) throw new Error("Live quotes require a vendor");
  if (mode === "practice" && !command.practiceScenarioId) {
    throw new Error("Practice quotes require a scenario");
  }

  // Pricing stays entirely in the pure domain package and is always recalculated server-side.
  const calculation = calculateQuote(command.input, catalog);
  const canonicalInput = JSON.parse(canonicalJson(command.input)) as unknown;
  const canonicalOutput = JSON.parse(canonicalJson(calculation)) as unknown;

  return db.transaction(async (tx) => {
    const inserted = await tx.query<{ id: string }>(
      `insert into quotes (
         organization_id, rep_membership_id, vendor_id, practice_scenario_id,
         mode, status, catalog_version, idempotency_key, notes, currency,
         setup_total_cents, monthly_total_cents, commissionable_mrr_cents,
         upfront_commission_cents, monthly_residual_cents, year_one_earnings_cents,
         calculation_hash
       ) values ($1,$2,$3,$4,$5,'draft',$6,$7,$8,'USD',$9,$10,$11,$12,$13,$14,$15)
       on conflict (rep_membership_id, idempotency_key) do nothing
       returning id`,
      [organizationId, repMembershipId, command.vendorId ?? null,
       command.practiceScenarioId ?? null, mode, calculation.catalogVersion,
       idempotencyKey, command.notes ?? null, calculation.totals.setupCents,
       calculation.totals.monthlyCents, calculation.totals.commissionableMrrCents,
       calculation.totals.upfrontCommissionCents,
       calculation.totals.monthlyResidualCents,
       calculation.totals.yearOneEarningsCents, calculation.calculationHash],
    );

    let quoteId = inserted.rows[0]?.id;
    if (!quoteId) {
      const existing = await tx.query<{ id: string; calculation_hash: string }>(
        `select id, calculation_hash from quotes
          where rep_membership_id = $1 and idempotency_key = $2`,
        [repMembershipId, idempotencyKey],
      );
      const row = existing.rows[0];
      if (!row) throw new Error("Idempotent quote lookup failed");
      if (row.calculation_hash !== calculation.calculationHash) {
        throw new Error("Idempotency key was already used for a different quote calculation");
      }
      return loadSavedQuote(tx, row.id);
    }

    for (const [sortOrder, line] of calculation.lines.entries()) {
      await tx.query(
        `insert into quote_lines (
           quote_id, product_code, product_name, line_kind, classification, quantity,
           list_setup_cents, list_monthly_cents, tier_discount_bps,
           bundle_discount_bps, applied_discount_bps, final_setup_cents,
           final_monthly_cents, commissionable_monthly_cents, reason_code,
           explanation, sort_order
         ) values ($1,$2,$3,$4,$5,1,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [quoteId, line.productCode, line.productName, line.kind, line.classification,
         line.listSetupCents, line.listMonthlyCents, line.tierDiscountBps,
         line.bundleDiscountBps, line.appliedDiscountBps, line.finalSetupCents,
         line.finalMonthlyCents, line.commissionableMonthlyCents, line.reasonCode,
         line.explanation, sortOrder],
      );
    }
    await tx.query(
      `insert into quote_calculation_snapshots (
         quote_id, engine_version, catalog_version, canonical_input_json,
         canonical_output_json, source_checksum, calculation_hash
       ) values ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)`,
      [quoteId, calculation.engineVersion, calculation.catalogVersion,
       JSON.stringify(canonicalInput), JSON.stringify(canonicalOutput),
       calculation.catalogChecksum, calculation.calculationHash],
    );
    return loadSavedQuote(tx, quoteId);
  });
}
