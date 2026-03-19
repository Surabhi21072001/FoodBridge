import { z } from 'zod';

export const listNotificationsSchema = z.object({
  query: z.object({
    is_read: z.string().transform((val) => val === 'true').optional(),
    type: z.string().optional(),
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid notification ID'),
  }),
});
