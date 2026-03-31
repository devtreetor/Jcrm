import { z } from 'zod';
import { ROLES } from '@/lib/constants';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200, 'Full name too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum(ROLES as unknown as [string, ...string[]]),
  team_lead_id: z.string().uuid('Invalid team lead ID').nullable().optional(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200, 'Full name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(ROLES as unknown as [string, ...string[]]).optional(),
  team_lead_id: z.string().uuid('Invalid team lead ID').nullable().optional(),
  is_active: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
