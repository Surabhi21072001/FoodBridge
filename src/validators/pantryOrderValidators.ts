import { z } from 'zod';

export const addItemToCartSchema = z.object({
  body: z.object({
    inventory_id: z.string().uuid('Invalid inventory ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
  }),
  params: z.object({
    inventory_id: z.string().uuid('Invalid inventory ID'),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    inventory_id: z.string().uuid('Invalid inventory ID'),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['cart', 'submitted', 'prepared', 'picked_up', 'cancelled']).optional(),
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  }),
});
