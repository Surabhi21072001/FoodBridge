import { z } from 'zod';

export const createReservationSchema = z.object({
  body: z.object({
    listing_id: z.string().uuid('Invalid listing ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
    pickup_time: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const confirmPickupSchema = z.object({
  body: z.object({
    confirmation_code: z.string().length(6, 'Confirmation code must be 6 characters'),
  }),
  params: z.object({
    id: z.string().uuid('Invalid reservation ID'),
  }),
});

export const reservationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid reservation ID'),
  }),
});

export const listReservationsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'confirmed', 'picked_up', 'cancelled', 'no_show']).optional(),
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  }),
});
