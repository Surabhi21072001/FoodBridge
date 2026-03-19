/**
 * Validation helper for create_listing tool arguments.
 * Mirrors the rules the agent enforces before calling the tool.
 */

export const VALID_CATEGORIES = [
  "meal",
  "snack",
  "beverage",
  "pantry_item",
  "deal",
  "event_food",
] as const;

export type ListingCategory = (typeof VALID_CATEGORIES)[number];

export interface CreateListingArgs {
  title: string;
  category: string;
  quantity_available: number;
  pickup_location: string;
  available_from: string;
  available_until: string;
  description?: string;
  dietary_tags?: string[];
  allergen_info?: string[];
  cuisine_type?: string;
  original_price?: number;
  discounted_price?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreateListingArgs(args: Partial<CreateListingArgs>): ValidationResult {
  const errors: string[] = [];

  // P1 — Required fields
  const required: (keyof CreateListingArgs)[] = [
    "title",
    "category",
    "quantity_available",
    "pickup_location",
    "available_from",
    "available_until",
  ];
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // P3 — Quantity must be positive integer
  if (args.quantity_available !== undefined) {
    if (!Number.isInteger(args.quantity_available) || args.quantity_available < 1) {
      errors.push("quantity_available must be a positive integer");
    }
  }

  // P4 — Category must be valid enum
  if (args.category !== undefined && !VALID_CATEGORIES.includes(args.category as ListingCategory)) {
    errors.push(
      `category must be one of: ${VALID_CATEGORIES.join(", ")}. Got: ${args.category}`
    );
  }

  // P2 — Date ordering
  if (args.available_from && args.available_until) {
    const from = new Date(args.available_from).getTime();
    const until = new Date(args.available_until).getTime();
    if (isNaN(from)) errors.push("available_from is not a valid date");
    else if (isNaN(until)) errors.push("available_until is not a valid date");
    else if (from >= until) errors.push("available_from must be before available_until");
  }

  // P5 — Price ordering
  if (args.original_price !== undefined && args.discounted_price !== undefined) {
    if (isNaN(args.original_price) || isNaN(args.discounted_price)) {
      errors.push("original_price and discounted_price must be valid numbers");
    } else if (args.discounted_price > args.original_price) {
      errors.push("discounted_price must not exceed original_price");
    }
  }

  return { valid: errors.length === 0, errors };
}
