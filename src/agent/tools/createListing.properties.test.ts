/**
 * Property-Based Tests for create_listing validation
 * Uses fast-check to verify correctness properties hold across all inputs
 */

import * as fc from "fast-check";
import { validateCreateListingArgs, VALID_CATEGORIES } from "./createListingValidation";

// Base valid args for composing test cases
const validBase = {
  title: "Test Food",
  category: "meal" as const,
  quantity_available: 5,
  pickup_location: "Student Union",
  available_from: "2026-03-16T15:00:00.000Z",
  available_until: "2026-03-16T18:00:00.000Z",
};

/**
 * P1 — Required fields completeness
 * Validates: Requirements 1.2
 *
 * For any combination of missing required fields, validation must fail.
 */
describe("P1 — Required fields completeness", () => {
  const requiredFields = [
    "title",
    "category",
    "quantity_available",
    "pickup_location",
    "available_from",
    "available_until",
  ] as const;

  it("any subset of missing required fields causes validation to fail", () => {
    // Generate a non-empty subset of required fields to omit
    const fieldArb = fc.subarray(requiredFields as unknown as string[], { minLength: 1 });

    fc.assert(
      fc.property(fieldArb, (fieldsToOmit) => {
        const args: Record<string, unknown> = { ...validBase };
        for (const f of fieldsToOmit) {
          delete args[f];
        }
        const result = validateCreateListingArgs(args as any);
        return result.valid === false;
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * P2 — Date ordering
 * Validates: Requirements 5.1
 *
 * For any pair of dates where from >= until, validation must fail.
 */
describe("P2 — Date ordering", () => {
  it("available_from >= available_until always fails", () => {
    // Generate two timestamps and ensure from >= until
    const dateArb = fc.integer({ min: 1700000000000, max: 1900000000000 });

    fc.assert(
      fc.property(dateArb, dateArb, (t1, t2) => {
        const from = Math.max(t1, t2);
        const until = Math.min(t1, t2);
        if (from === until) return true; // skip equal case — tested separately

        const result = validateCreateListingArgs({
          ...validBase,
          available_from: new Date(from).toISOString(),
          available_until: new Date(until).toISOString(),
        });
        return result.valid === false;
      }),
      { numRuns: 500 }
    );
  });

  it("available_from === available_until always fails", () => {
    const dateArb = fc.integer({ min: 1700000000000, max: 1900000000000 });

    fc.assert(
      fc.property(dateArb, (t) => {
        const iso = new Date(t).toISOString();
        const result = validateCreateListingArgs({
          ...validBase,
          available_from: iso,
          available_until: iso,
        });
        return result.valid === false;
      }),
      { numRuns: 200 }
    );
  });

  it("available_from < available_until always passes (date check only)", () => {
    const dateArb = fc.integer({ min: 1700000000000, max: 1900000000000 });

    fc.assert(
      fc.property(dateArb, fc.integer({ min: 1, max: 86400000 }), (t, offset) => {
        const result = validateCreateListingArgs({
          ...validBase,
          available_from: new Date(t).toISOString(),
          available_until: new Date(t + offset).toISOString(),
        });
        // Should not have date-related errors
        return !result.errors.some((e) => e.includes("available_from") || e.includes("available_until"));
      }),
      { numRuns: 500 }
    );
  });
});

/**
 * P3 — Quantity positivity
 * Validates: Requirements 5.2
 *
 * Any non-positive or non-integer quantity must fail.
 */
describe("P3 — Quantity positivity", () => {
  it("any quantity <= 0 fails", () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (qty) => {
        const result = validateCreateListingArgs({ ...validBase, quantity_available: qty });
        return result.valid === false;
      }),
      { numRuns: 500 }
    );
  });

  it("any positive integer quantity passes (quantity check only)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (qty) => {
        const result = validateCreateListingArgs({ ...validBase, quantity_available: qty });
        return !result.errors.some((e) => e.includes("quantity_available"));
      }),
      { numRuns: 500 }
    );
  });

  it("any non-integer quantity fails", () => {
    // Generate floats that are not whole numbers using 32-bit safe values
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(9999.5) }).filter((n) => !Number.isInteger(n)),
        (qty) => {
          const result = validateCreateListingArgs({ ...validBase, quantity_available: qty });
          return result.valid === false;
        }
      ),
      { numRuns: 300 }
    );
  });
});

/**
 * P4 — Category validity
 * Validates: Requirements 5.3
 *
 * Any string not in the valid enum must fail.
 */
describe("P4 — Category validity", () => {
  it("any string not in VALID_CATEGORIES fails", () => {
    const invalidCategoryArb = fc
      .string({ minLength: 1 })
      .filter((s) => !VALID_CATEGORIES.includes(s as any));

    fc.assert(
      fc.property(invalidCategoryArb, (cat) => {
        const result = validateCreateListingArgs({ ...validBase, category: cat });
        return result.valid === false;
      }),
      { numRuns: 500 }
    );
  });

  it("every value in VALID_CATEGORIES passes (category check only)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_CATEGORIES), (cat) => {
        const result = validateCreateListingArgs({ ...validBase, category: cat });
        return !result.errors.some((e) => e.includes("category"));
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * P5 — Price ordering
 * Validates: Requirements 5.4
 *
 * discounted_price > original_price must always fail.
 */
describe("P5 — Price ordering", () => {
  // fc.double with noNaN:true avoids NaN in generated values
  const positivePrice = fc.double({ min: 0.01, max: 1000, noNaN: true });

  it("discounted_price > original_price always fails", () => {
    fc.assert(
      fc.property(positivePrice, fc.double({ min: 0.01, max: 100, noNaN: true }), (base, delta) => {
        const result = validateCreateListingArgs({
          ...validBase,
          original_price: base,
          discounted_price: base + delta,
        });
        return result.valid === false;
      }),
      { numRuns: 500 }
    );
  });

  it("discounted_price <= original_price always passes (price check only)", () => {
    fc.assert(
      fc.property(positivePrice, fc.double({ min: 0.01, max: 1, noNaN: true }), (original, ratio) => {
        const discounted = original * ratio;
        const result = validateCreateListingArgs({
          ...validBase,
          original_price: original,
          discounted_price: discounted,
        });
        return !result.errors.some((e) => e.includes("discounted_price"));
      }),
      { numRuns: 500 }
    );
  });
});
