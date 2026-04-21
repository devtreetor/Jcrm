import { z } from 'zod';
import { CALL_STATUSES } from '@/lib/constants';

export const createCallLogSchema = z.object({
  status: z.enum(CALL_STATUSES as unknown as [string, ...string[]]),
  notes: z.string().max(2000, 'Notes too long').nullable().optional(),
  callback_date: z.string().datetime({ message: 'Invalid date format' }).nullable().optional(),
  photo_urls: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos per call').optional(),
});

export type CreateCallLogInput = z.infer<typeof createCallLogSchema>;
