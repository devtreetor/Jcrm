import { z } from 'zod';
import { CALL_STATUSES } from '@/lib/constants';

export const createCallLogSchema = z.object({
  status: z.enum(CALL_STATUSES as unknown as [string, ...string[]]),
  notes: z.string().max(2000, 'Notes too long').nullable().optional(),
  callback_date: z.string().datetime({ message: 'Invalid date format' }).nullable().optional(),
});

export type CreateCallLogInput = z.infer<typeof createCallLogSchema>;
