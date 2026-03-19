import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    appointment_time: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Invalid appointment time' }
    ),
    duration_minutes: z.number().int().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    appointment_time: z.string().datetime().optional(),
    duration_minutes: z.number().int().positive().optional(),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  }),
});

export const appointmentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid appointment ID'),
  }),
});

export const listAppointmentsSchema = z.object({
  query: z.object({
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
    upcoming: z.string().transform((val) => val === 'true').optional(),
    date: z.string().datetime().optional(),
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  }),
});
