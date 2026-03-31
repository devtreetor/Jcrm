import { z } from 'zod';

export const importLeadRowSchema = z.object({
  school_name: z.string().min(1, 'School name is required'),
  location: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  board: z.string().optional().default(''),
  principal_phone: z.string().optional().default(''),
  chairman_phone: z.string().optional().default(''),
});

export const importQuerySchema = z.object({
  source_event: z.string().optional(),
});

export type ImportLeadRowInput = z.infer<typeof importLeadRowSchema>;
export type ImportQueryInput = z.infer<typeof importQuerySchema>;
