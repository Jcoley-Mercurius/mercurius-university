export type Cents = number & { readonly __brand: "Cents" };
export type BasisPoints = number & { readonly __brand: "BasisPoints" };

const MAX_CENTS = 9_000_000_000_000;

export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_CENTS) {
    throw new RangeError(`Money must be a nonnegative safe integer <= ${MAX_CENTS} cents`);
  }
  return value as Cents;
}

export function basisPoints(value: number): BasisPoints {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000) {
    throw new RangeError("Basis points must be an integer between 0 and 10000");
  }
  return value as BasisPoints;
}

function roundPositiveRatioHalfUp(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? quotient + 1n : quotient;
}

export function multiplyByBasisPointsHalfUp(
  amount: Cents,
  rate: BasisPoints,
): Cents {
  return cents(
    Number(roundPositiveRatioHalfUp(BigInt(amount) * BigInt(rate), 10_000n)),
  );
}

export function applyDiscountHalfUp(
  listAmount: Cents,
  discount: BasisPoints,
): Cents {
  return cents(
    Number(
      roundPositiveRatioHalfUp(
        BigInt(listAmount) * BigInt(10_000 - discount),
        10_000n,
      ),
    ),
  );
}

export function sumCents(values: readonly Cents[]): Cents {
  return cents(values.reduce((total, value) => total + value, 0));
}
