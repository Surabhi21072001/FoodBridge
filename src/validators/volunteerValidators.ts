import { z } from 'zod';

export const createOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    max_volunteers: z.number().positive(),
    event_date: z.string().datetime(),
  }),
});

export const signupSchema = z.object({
  body: z.object({
    opportunity_id: z.string().uuid(),
  }),
});

export const updateOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    max_volunteers: z.number().positive().optional(),
    status: z.enum(['open', 'closed', 'completed']).optional(),
  }),
});
