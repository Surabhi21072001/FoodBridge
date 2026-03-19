import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    dietary_restrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    favorite_cuisines: z.array(z.string()).optional(),
    preferred_providers: z.array(z.string()).optional(),
    notification_preferences: z.record(z.boolean()).optional(),
  }),
});

export const trackPantrySelectionSchema = z.object({
  body: z.object({
    inventory_id: z.string().uuid(),
    quantity: z.number().positive(),
  }),
});

export const trackReservationSchema = z.object({
  body: z.object({
    provider_id: z.string().uuid(),
    listing_title: z.string(),
    category: z.string(),
  }),
});

export const trackFilterSchema = z.object({
  body: z.record(z.any()),
});
