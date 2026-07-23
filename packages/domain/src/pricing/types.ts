import type { BasisPoints, Cents } from "./money";

export type CatalogStatus = "active" | "retired";
export type CoreCode =
  | "FREE"
  | "SPARK"
  | "SPARK_PRO"
  | "INSIGHT"
  | "INTELLIGENCE"
  | "INTELLIGENCE_PRO"
  | "NEXUS";
export type EnhancementCode =
  | "AI_MARKETING_COPILOT"
  | "VISIBILITY_ACCELERATOR"
  | "RETENTION_ENGINE"
  | "LEAD_VELOCITY"
  | "SOCIAL_COMMAND"
  | "VIDEO_VELOCITY"
  | "CONTENT_COMMAND_SUITE"
  | "ADS_COMMAND";
export type ProductCode = CoreCode | EnhancementCode;
export type EnhancementClassification = "software" | "service" | "ads";

export interface CoreProduct {
  readonly code: CoreCode;
  readonly name: string;
  readonly setupCents: Cents | null;
  readonly monthlyCents: Cents | null;
  readonly customPricing: boolean;
  readonly baseCommissionBps: BasisPoints | null;
  readonly floorCommissionBps: BasisPoints | null;
  readonly sortOrder: number;
}

export interface EnhancementProduct {
  readonly code: EnhancementCode;
  readonly name: string;
  readonly classification: EnhancementClassification;
  readonly monthlyCents: Cents;
  readonly sortOrder: number;
}

export interface TierDiscountRule {
  readonly coreCode: CoreCode;
  readonly softwareBps: BasisPoints | null;
  readonly serviceCapBps: BasisPoints | null;
}

export interface BundleDiscountRule {
  readonly minimumCount: number;
  readonly discountBps: BasisPoints;
}

export interface CatalogPolicies {
  readonly maxLineDiscountBps: BasisPoints;
  readonly upfrontCommissionBps: BasisPoints;
  readonly residualBps: BasisPoints;
  readonly adsCountsForBundle: false;
  readonly adSpendCommissionable: false;
  readonly roundingMode: "HALF_UP_PER_LINE";
  readonly residualStartsMonth: 2;
  readonly yearOneResidualPayments: 12;
}

export interface PricingCatalog {
  readonly code: string;
  readonly version: string;
  readonly status: CatalogStatus;
  readonly effectiveFrom: string;
  readonly currency: "USD";
  readonly sourceDocument: string;
  readonly checksumAlgorithm: "SHA-256";
  readonly checksum: string;
  readonly cores: readonly CoreProduct[];
  readonly enhancements: readonly EnhancementProduct[];
  readonly tierRules: readonly TierDiscountRule[];
  readonly bundleRules: readonly BundleDiscountRule[];
  readonly policies: CatalogPolicies;
}

export interface NexusPricingInput {
  readonly setupCents: number;
  readonly monthlyCents: number;
  readonly softwareTierDiscountBps: number;
  readonly serviceCapBps: number;
}

export interface ManagerApprovalInput {
  readonly approvalId: string;
  readonly approvedBy: string;
}

export interface QuoteInput {
  readonly coreCode: string;
  readonly enhancementCodes: readonly string[];
  readonly adSpendCents: number;
  readonly nexusPricing?: NexusPricingInput;
  readonly managerApproval?: ManagerApprovalInput;
}

export type LineKind = "core" | "enhancement" | "ad_spend";
export type LineClassification =
  | "core"
  | EnhancementClassification
  | "pass_through";
export type ReasonCode =
  | "CORE_LIST"
  | "SOFTWARE_TIER"
  | "SOFTWARE_TIER_BUNDLE"
  | "SOFTWARE_CAPPED"
  | "SERVICE_CAP"
  | "ADS_EXEMPT"
  | "PASS_THROUGH";

export interface QuoteLine {
  readonly productCode: string;
  readonly productName: string;
  readonly kind: LineKind;
  readonly classification: LineClassification;
  readonly listSetupCents: Cents;
  readonly listMonthlyCents: Cents;
  readonly tierDiscountBps: BasisPoints;
  readonly bundleDiscountBps: BasisPoints;
  readonly appliedDiscountBps: BasisPoints;
  readonly finalSetupCents: Cents;
  readonly finalMonthlyCents: Cents;
  readonly commissionableMonthlyCents: Cents;
  readonly reasonCode: ReasonCode;
  readonly explanation: string;
}

export interface QuoteTotals {
  readonly setupCents: Cents;
  readonly monthlyCents: Cents;
  readonly commissionableMrrCents: Cents;
  readonly upfrontCommissionCents: Cents;
  readonly monthlyResidualCents: Cents;
  readonly yearOneEarningsCents: Cents;
}

export type WarningCode = "NO_ENHANCEMENTS" | "RESIDUAL_STARTS_MONTH_2";
export interface QuoteWarning {
  readonly code: WarningCode;
  readonly message: string;
}

export interface QuoteCalculation {
  readonly engineVersion: string;
  readonly catalogCode: string;
  readonly catalogVersion: string;
  readonly catalogChecksum: string;
  readonly lines: readonly QuoteLine[];
  readonly totals: QuoteTotals;
  readonly warnings: readonly QuoteWarning[];
  readonly calculationHash: string;
}
