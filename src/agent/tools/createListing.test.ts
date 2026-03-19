import { validateCreateListingArgs, VALID_CATEGORIES } from "./createListingValidation";

const validArgs = {
  title: "Leftover Pizza",
  category: "meal",
  quantity_available: 10,
  pickup_location: "Student Union Room 101",
  available_from: "2026-03-16T15:00:00.000Z",
  available_until: "2026-03-16T18:00:00.000Z",
};

describe("validateCreateListingArgs", () => {
  describe("required fields (P1)", () => {
    it("passes when all required fields are present", () => {
      const result = validateCreateListingArgs(validArgs);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    const requiredFields = [
      "title",
      "category",
      "quantity_available",
      "pickup_location",
      "available_from",
      "available_until",
    ] as const;

    requiredFields.forEach((field) => {
      it(`fails when ${field} is missing`, () => {
        const args = { ...validArgs, [field]: undefined };
        const result = validateCreateListingArgs(args);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes(field))).toBe(true);
      });

      it(`fails when ${field} is empty string`, () => {
        const args = { ...validArgs, [field]: "" as any };
        const result = validateCreateListingArgs(args);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe("quantity validation (P3)", () => {
    it("passes with quantity 1", () => {
      const result = validateCreateListingArgs({ ...validArgs, quantity_available: 1 });
      expect(result.valid).toBe(true);
    });

    it("fails with quantity 0", () => {
      const result = validateCreateListingArgs({ ...validArgs, quantity_available: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("quantity_available"))).toBe(true);
    });

    it("fails with negative quantity", () => {
      const result = validateCreateListingArgs({ ...validArgs, quantity_available: -5 });
      expect(result.valid).toBe(false);
    });

    it("fails with non-integer quantity", () => {
      const result = validateCreateListingArgs({ ...validArgs, quantity_available: 2.5 });
      expect(result.valid).toBe(false);
    });
  });

  describe("category validation (P4)", () => {
    VALID_CATEGORIES.forEach((cat) => {
      it(`passes with valid category: ${cat}`, () => {
        const result = validateCreateListingArgs({ ...validArgs, category: cat });
        expect(result.valid).toBe(true);
      });
    });

    it("fails with invalid category", () => {
      const result = validateCreateListingArgs({ ...validArgs, category: "junk_food" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("category"))).toBe(true);
    });

    it("fails with empty category", () => {
      const result = validateCreateListingArgs({ ...validArgs, category: "" });
      expect(result.valid).toBe(false);
    });
  });

  describe("date ordering (P2)", () => {
    it("fails when available_from equals available_until", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        available_from: "2026-03-16T15:00:00.000Z",
        available_until: "2026-03-16T15:00:00.000Z",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("available_from"))).toBe(true);
    });

    it("fails when available_from is after available_until", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        available_from: "2026-03-16T18:00:00.000Z",
        available_until: "2026-03-16T15:00:00.000Z",
      });
      expect(result.valid).toBe(false);
    });

    it("fails with invalid date string", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        available_from: "not-a-date",
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("price ordering (P5)", () => {
    it("passes when discounted_price is less than original_price", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        original_price: 10,
        discounted_price: 7,
      });
      expect(result.valid).toBe(true);
    });

    it("passes when discounted_price equals original_price", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        original_price: 10,
        discounted_price: 10,
      });
      expect(result.valid).toBe(true);
    });

    it("fails when discounted_price exceeds original_price", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        original_price: 5,
        discounted_price: 8,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("discounted_price"))).toBe(true);
    });

    it("passes when only original_price is provided (no discounted_price)", () => {
      const result = validateCreateListingArgs({ ...validArgs, original_price: 10 });
      expect(result.valid).toBe(true);
    });
  });

  describe("optional fields", () => {
    it("passes with all optional fields provided", () => {
      const result = validateCreateListingArgs({
        ...validArgs,
        description: "Fresh pepperoni pizza",
        dietary_tags: ["vegetarian"],
        allergen_info: ["gluten"],
        cuisine_type: "Italian",
        original_price: 12,
        discounted_price: 8,
      });
      expect(result.valid).toBe(true);
    });
  });
});
