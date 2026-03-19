import { z } from 'zod';

export const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.enum(['meal', 'snack', 'beverage', 'pantry_item', 'deal', 'event_food']),
    cuisine_type: z.string().optional(),
    dietary_tags: z.array(z.string()).optional(),
    allergen_info: z.array(z.string()).optional(),
    quantity_available: z.number().int().positive('Quantity must be positive'),
    unit: z.string().optional(),
    original_price: z.number().nonnegative().optional(),
    discounted_price: z.number().nonnegative().optional(),
    pickup_location: z.string().min(1, 'Pickup location is required'),
    available_from: z.string().datetime(),
    available_until: z.string().datetime(),
    image_urls: z.array(z.string().url()).optional(),
  }),
});

export const updateListingSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.enum(['meal', 'snack', 'beverage', 'pantry_item', 'deal', 'event_food']).optional(),
    cuisine_type: z.string().optional(),
    dietary_tags: z.array(z.string()).optional(),
    allergen_info: z.array(z.string()).optional(),
    quantity_available: z.number().int().positive().optional(),
    unit: z.string().optional(),
    original_price: z.number().nonnegative().optional(),
    discounted_price: z.number().nonnegative().optional(),
    pickup_location: z.string().min(1).optional(),
    available_from: z.string().datetime().optional(),
    available_until: z.string().datetime().optional(),
    image_urls: z.array(z.string().url()).optional(),
    status: z.enum(['active', 'reserved', 'completed', 'cancelled', 'expired']).optional(),
  }),
});

export const listListingsSchema = z.object({
  query: z.object({
    provider_id: z.string().uuid().optional(),
    category: z.enum(['meal', 'snack', 'beverage', 'pantry_item', 'deal', 'event_food']).optional(),
    status: z.enum(['active', 'reserved', 'completed', 'cancelled', 'expired']).optional(),
    dietary_tags: z.string().transform((val) => val.split(',')).optional(),
    available_now: z.string().transform((val) => val === 'true').optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    max_price: z.string().transform((val) => parseFloat(val)).optional(),
    min_price: z.string().transform((val) => parseFloat(val)).optional(),
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  }),
});

export const listingIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid listing ID'),
  }),
});
