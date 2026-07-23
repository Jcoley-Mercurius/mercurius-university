export type PricingErrorCode =
  | "INVALID_INPUT"
  | "INVALID_MONEY"
  | "INVALID_BASIS_POINTS"
  | "DUPLICATE_PRODUCT"
  | "ADS_REQUIRED"
  | "UNKNOWN_PRODUCT"
  | "CUSTOM_APPROVAL_REQUIRED"
  | "INVALID_CATALOG";

export class PricingError extends Error {
  public constructor(
    public readonly code: PricingErrorCode,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "PricingError";
  }
}
