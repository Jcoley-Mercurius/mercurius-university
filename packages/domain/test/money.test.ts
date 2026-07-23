import { describe, expect, it } from "vitest";

import {
  applyDiscountHalfUp,
  basisPoints,
  cents,
  multiplyByBasisPointsHalfUp,
  sumCents,
} from "../src/pricing/index.js";

describe("integer Money utilities", () => {
  it("rounds exact half cents up", () => {
    expect(multiplyByBasisPointsHalfUp(cents(24_055), basisPoints(1_000))).toBe(
      2_406,
    );
    expect(applyDiscountHalfUp(cents(1), basisPoints(5_000))).toBe(1);
  });

  it("never uses fractional cents", () => {
    expect(applyDiscountHalfUp(cents(14_900), basisPoints(500))).toBe(14_155);
    expect(sumCents([cents(1), cents(2), cents(3)])).toBe(6);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects invalid cent value %s",
    (value) => expect(() => cents(value)).toThrow(RangeError),
  );

  it.each([-1, 1.5, 10_001])("rejects invalid basis points %s", (value) =>
    expect(() => basisPoints(value)).toThrow(RangeError),
  );
});
