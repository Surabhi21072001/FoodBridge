import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  body: z.object({
    item_name: z.string().min(1, 'Item name is required'),
    category: z.enum(['canned_goods', 'dry_goods', 'fresh_produce', 'frozen', 'dairy', 'snacks', 'beverages', 'other']),
    quantity: z.number().int().nonnegative('Quantity cannot be negative'),
    unit: z.string().optional(),
    expiration_date: z.string().datetime().optional(),
    dietary_tags: z.array(z.string()).optional(),
    allergen_info: z.array(z.string()).optional(),
    location: z.string().optional(),
    reorder_threshold: z.number().int().positive().optional(),
  }),
});

export const updateInventoryItemSchema = z.object({
  body: z.object({
    item_name: z.string().min(1).optional(),
    category: z.enum(['canned_goods', 'dry_goods', 'fresh_produce', 'frozen', 'dairy', 'snacks', 'beverages', 'other']).optional(),
    quantity: z.number().int().nonnegative().optional(),
    unit: z.string().optional(),
    expiration_date: z.string().datetime().optional(),
    dietary_tags: z.array(z.string()).optional(),
    allergen_info: z.array(z.string()).optional(),
    location: z.string().optional(),
    reorder_threshold: z.number().int().positive().optional(),
  }),
});

export const adjustQuantitySchema = z.object({
  body: z.object({
    quantity_change: z.number().int(),
  }),
});

export const listInventorySchema = z.object({
  query: z.object({
    category: z.enum(['canned_goods', 'dry_goods', 'fresh_produce', 'frozen', 'dairy', 'snacks', 'beverages', 'other']).optional(),
    low_stock: z.string().transform((val) => val === 'true').optional(),
    dietary_tags: z.string().transform((val) => val.split(',')).optional(),
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  }),
});

export const inventoryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid inventory ID'),
  }),
});
