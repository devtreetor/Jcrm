import { z } from 'zod';
import { LEAD_STAGES } from '@/lib/constants';

export const assignLeadSchema = z.object({
  assigned_tl_id: z.string().uuid('Invalid team lead ID').nullable(),
  assigned_cl_id: z.string().uuid('Invalid caller ID').nullable(),
});

export const updateStageSchema = z.object({
  stage: z.enum(LEAD_STAGES as unknown as [string, ...string[]]),
});

export const updateMultiStageSchema = z.object({
  stages: z.array(z.enum(LEAD_STAGES as unknown as [string, ...string[]])).min(1, 'At least one stage required').max(10),
});

export const leadFiltersSchema = z.object({
  stage: z.enum(LEAD_STAGES as unknown as [string, ...string[]]).optional(),
  assigned_tl_id: z.string().uuid().optional(),
  assigned_cl_id: z.string().uuid().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type LeadFiltersInput = z.infer<typeof leadFiltersSchema>;
